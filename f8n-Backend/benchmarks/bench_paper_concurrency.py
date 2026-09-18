"""Benchmarks the paper-trading tick path under concurrency: N threads, each
mirroring one running PaperSession, run GraphEngine.run_tick() and then do the
same DB write + Socket.IO room emit that app/papertrading/bot.py's _apply_signal/
_record_trade/_record_equity do every poll - sharing one Flask app, one SQLite
file DB, and one SocketIO instance, exactly the single-process model production
actually runs (see the README's "Single-instance background jobs" limitation).

This is deliberately network-free - a real deployment's price/sentiment fetch is
measured separately by bench_network.py, since that's a completely different
(and, per BENCHMARKS.md, far larger) source of latency. What this isolates is
the overhead this codebase itself adds on top of that: DB commits and Socket.IO
room broadcasts, and whether N agents running at once contend with each other
for the GIL/DB/socket layer.

A Socket.IO test client subscribes to each session's room so every emit() has a
real subscriber to serialize a payload to and deliver it to, the same as a
browser tab watching a live paper session.

Usage:
    python -m benchmarks.bench_paper_concurrency
    python -m benchmarks.bench_paper_concurrency --sessions 1 5 20 50 --ticks 30
"""

import argparse
import json
import statistics
import tempfile
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from app import create_app
from app.extensions import db, socketio
from app.graph.engine import GraphEngine
from app.models.backtest import BacktestRun  # noqa: F401 - ensures all models register before create_all()
from app.models.market_data import OHLCVCache  # noqa: F401
from app.models.paper_trading import PaperEquityPoint, PaperSession, PaperTrade
from app.models.sentiment import SentimentSnapshot  # noqa: F401
from app.models.strategy import Strategy


class FastContext:
    """Same no-I/O stand-in as bench_engine.BenchmarkContext - what's measured
    here is DB + Socket.IO overhead, not a network call. Unlike that one, this
    deliberately crosses the arbitrage graph's 1% spread threshold every other
    tick, so the benchmark exercises both write paths a real triggering agent
    hits: an equity-point-only tick, and an equity-point-plus-trade tick (extra
    DB row + extra socket emit) - a constant, never-triggering price would only
    ever measure the cheaper of the two."""

    def __init__(self):
        self._call_count = 0

    def get_price(self, exchange, symbol):
        pair_index = self._call_count // 2
        is_first_in_pair = self._call_count % 2 == 0
        self._call_count += 1

        base = 100.0
        if is_first_in_pair:
            return base
        return base * 1.02 if pair_index % 2 == 0 else base * 1.005

    def get_sentiment(self, ticker, sources=None):
        return {"positive": 40.0, "negative": 10.0, "neutral": 50.0}

    def log(self, message, level="info"):
        pass


def _arbitrage_graph():
    return {
        "nodes": [
            {"id": "a", "type": "source.exchange_ticker", "config": {"exchange": "binance", "symbol": "BTC/USDT"}},
            {"id": "b", "type": "source.exchange_ticker", "config": {"exchange": "kraken", "symbol": "BTC/USDT"}},
            {"id": "spread", "type": "indicator.spread_pct", "config": {}},
            {"id": "gate", "type": "logic.threshold", "config": {"operator": ">=", "threshold": 1.0}},
            {
                "id": "buy",
                "type": "action.paper_buy",
                "config": {"exchange": "binance", "symbol": "BTC/USDT", "quantity": 0.01, "fee_pct": 0.001},
            },
        ],
        "edges": [
            {"source": "a", "sourceHandle": "price", "target": "spread", "targetHandle": "price_a"},
            {"source": "b", "sourceHandle": "price", "target": "spread", "targetHandle": "price_b"},
            {"source": "spread", "sourceHandle": "spread_pct", "target": "gate", "targetHandle": "value"},
            {"source": "gate", "sourceHandle": "triggered", "target": "buy", "targetHandle": "trigger"},
        ],
    }


def _session_worker(app, session_id, ticks, tick_latencies, trades_fired, lock):
    engine = GraphEngine()
    ctx = FastContext()
    graph = _arbitrage_graph()

    with app.app_context():
        for _ in range(ticks):
            start = time.perf_counter()

            signals = engine.run_tick(graph, ctx)
            for signal in signals:
                price = ctx.get_price(signal["exchange"], signal["symbol"])
                trade = PaperTrade(
                    session_id=session_id,
                    timestamp=datetime.utcnow(),
                    symbol=signal["symbol"],
                    side=signal["action"],
                    exchange=signal["exchange"],
                    price=price,
                    quantity=signal["quantity"],
                    fee=0.0,
                    is_testnet_order=False,
                    order_id=None,
                    pnl=None,
                )
                db.session.add(trade)
                db.session.commit()
                socketio.emit("paper_trade", trade.to_dict(), room=f"session_{session_id}")

            point = PaperEquityPoint(session_id=session_id, timestamp=datetime.utcnow(), equity=10000.0)
            db.session.add(point)
            db.session.commit()
            socketio.emit("paper_equity", point.to_dict(), room=f"session_{session_id}")

            elapsed = time.perf_counter() - start
            with lock:
                tick_latencies.append(elapsed)
                trades_fired[0] += len(signals)


def benchmark(num_sessions: int, ticks_per_session: int, db_path: Path) -> dict:
    # A real file-based sqlite DB, not TestingConfig's ":memory:" - :memory: forces
    # SQLAlchemy onto a single-connection StaticPool (there's no other way to keep
    # an in-memory DB alive across connections), which silently makes every thread
    # share one physical sqlite3 connection and corrupts state under concurrent
    # writes. A file gets a real per-checkout connection pool, safe for this.
    app = create_app("development", config_overrides={"SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}"})

    with app.app_context():
        db.create_all()
        strategy = Strategy(name="bench", graph_json=_arbitrage_graph())
        db.session.add(strategy)
        db.session.commit()

        session_ids = []
        for _ in range(num_sessions):
            session = PaperSession(
                strategy_id=strategy.id, graph_json=strategy.graph_json, starting_capital=10000.0, status="running"
            )
            db.session.add(session)
            db.session.commit()
            session_ids.append(session.id)

    # One Socket.IO test client per session, subscribed to its room - the same
    # join_session a browser tab does - so every emit() has a real subscriber.
    clients = []
    for session_id in session_ids:
        client = socketio.test_client(app)
        client.emit("join_session", {"session_id": session_id})
        clients.append(client)

    tick_latencies: list = []
    trades_fired = [0]
    lock = threading.Lock()
    threads = [
        threading.Thread(target=_session_worker, args=(app, sid, ticks_per_session, tick_latencies, trades_fired, lock))
        for sid in session_ids
    ]

    wall_start = time.perf_counter()
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    wall_elapsed = time.perf_counter() - wall_start

    for client in clients:
        client.disconnect()

    with app.app_context():
        db.engine.dispose()  # release sqlite's file handle before the temp dir is cleaned up (Windows locks open files)

    tick_latencies.sort()
    total_ticks = num_sessions * ticks_per_session
    return {
        "sessions": num_sessions,
        "ticks_per_session": ticks_per_session,
        "total_ticks": total_ticks,
        "trades_fired": trades_fired[0],
        "wall_seconds": wall_elapsed,
        "aggregate_ticks_per_sec": (total_ticks / wall_elapsed) if wall_elapsed else float("inf"),
        "tick_mean_ms": statistics.mean(tick_latencies) * 1000,
        "tick_p50_ms": tick_latencies[len(tick_latencies) // 2] * 1000,
        "tick_p95_ms": tick_latencies[int(len(tick_latencies) * 0.95)] * 1000,
    }


def run(session_counts, ticks_per_session) -> list:
    results = []
    for num_sessions in session_counts:
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "bench.db"
            results.append(benchmark(num_sessions, ticks_per_session, db_path))
    return results


def print_table(results):
    header = f"{'sessions':>8} {'ticks':>7} {'trades':>7} {'wall_s':>8} {'agg_ticks/s':>12} {'tick_mean_ms':>13} {'tick_p95_ms':>12}"
    print(header)
    print("-" * len(header))
    for r in results:
        print(
            f"{r['sessions']:>8} {r['total_ticks']:>7} {r['trades_fired']:>7} {r['wall_seconds']:>8.2f} "
            f"{r['aggregate_ticks_per_sec']:>12.1f} {r['tick_mean_ms']:>13.3f} {r['tick_p95_ms']:>12.3f}"
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sessions", type=int, nargs="+", default=[1, 5, 20, 50], help="Concurrent paper sessions")
    parser.add_argument("--ticks", type=int, default=30, help="Ticks each simulated session runs")
    parser.add_argument("--out", type=Path, default=None, help="Write results as JSON to this path")
    args = parser.parse_args()

    results = run(args.sessions, args.ticks)
    print_table(results)

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(
            json.dumps({"run_at": datetime.now(timezone.utc).isoformat(), "results": results}, indent=2)
        )
        print(f"\nWrote {args.out}")


if __name__ == "__main__":
    main()
