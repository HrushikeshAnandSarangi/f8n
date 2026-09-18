"""Benchmarks GraphEngine.run_tick() throughput as a strategy graph grows.

No network/DB dependency, same fixture style as tests/test_graph_engine.py - this
is dev-facing performance tooling, not a user-visible feature. It exists to catch
engine regressions before they ship, since both backtesting and paper trading call
run_tick() on every single bar/poll.

Usage:
    python -m benchmarks.bench_engine
    python -m benchmarks.bench_engine --widths 1 10 100 --iterations 1000
    python -m benchmarks.bench_engine --out benchmarks/results/latest.json
"""

import argparse
import json
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path

from app.graph.engine import GraphEngine


class BenchmarkContext:
    """A static-ish price context with no I/O, so what's being timed is purely the
    engine's own graph traversal/dispatch overhead, not a network or DB call."""

    def __init__(self):
        self._tick = 0.0

    def get_price(self, exchange, symbol):
        self._tick += 1
        return 100.0 + (self._tick % 50)

    def get_sentiment(self, ticker, sources=None):
        return {"positive": 40.0, "negative": 10.0, "neutral": 50.0}

    def log(self, message, level="info"):
        pass


def arbitrage_lanes_graph(width: int) -> dict:
    """`width` independent 5-node arbitrage lanes (2 sources -> spread -> threshold
    -> paper buy) sharing one graph, so node/edge count scales linearly with `width` -
    a stand-in for a large real-world agent built from many repeated sub-patterns."""
    nodes, edges = [], []
    for i in range(width):
        a, b, spread, gate, buy = f"a{i}", f"b{i}", f"spread{i}", f"gate{i}", f"buy{i}"
        nodes += [
            {"id": a, "type": "source.exchange_ticker", "config": {"exchange": "binance", "symbol": "BTC/USDT"}},
            {"id": b, "type": "source.exchange_ticker", "config": {"exchange": "kraken", "symbol": "BTC/USDT"}},
            {"id": spread, "type": "indicator.spread_pct", "config": {}},
            {"id": gate, "type": "logic.threshold", "config": {"operator": ">=", "threshold": 1.0}},
            {
                "id": buy,
                "type": "action.paper_buy",
                "config": {"exchange": "binance", "symbol": "BTC/USDT", "quantity": 0.01, "fee_pct": 0.001},
            },
        ]
        edges += [
            {"source": a, "sourceHandle": "price", "target": spread, "targetHandle": "price_a"},
            {"source": b, "sourceHandle": "price", "target": spread, "targetHandle": "price_b"},
            {"source": spread, "sourceHandle": "spread_pct", "target": gate, "targetHandle": "value"},
            {"source": gate, "sourceHandle": "triggered", "target": buy, "targetHandle": "trigger"},
        ]
    return {"nodes": nodes, "edges": edges}


def benchmark(width: int, iterations: int, warmup: int = 50) -> dict:
    graph = arbitrage_lanes_graph(width)
    ctx = BenchmarkContext()
    engine = GraphEngine()

    for _ in range(min(warmup, iterations)):
        engine.run_tick(graph, ctx)

    samples = []
    for _ in range(iterations):
        start = time.perf_counter()
        engine.run_tick(graph, ctx)
        samples.append(time.perf_counter() - start)

    samples.sort()
    mean = statistics.mean(samples)
    return {
        "width": width,
        "node_count": len(graph["nodes"]),
        "edge_count": len(graph["edges"]),
        "iterations": iterations,
        "mean_ms": mean * 1000,
        "p50_ms": samples[len(samples) // 2] * 1000,
        "p95_ms": samples[int(len(samples) * 0.95)] * 1000,
        "ticks_per_sec": (1 / mean) if mean else float("inf"),
    }


def run(widths, iterations) -> list:
    return [benchmark(width, iterations) for width in widths]


def print_table(results):
    header = f"{'nodes':>7} {'iters':>7} {'mean_ms':>9} {'p50_ms':>9} {'p95_ms':>9} {'ticks/s':>10}"
    print(header)
    print("-" * len(header))
    for r in results:
        print(
            f"{r['node_count']:>7} {r['iterations']:>7} {r['mean_ms']:>9.3f} "
            f"{r['p50_ms']:>9.3f} {r['p95_ms']:>9.3f} {r['ticks_per_sec']:>10.1f}"
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--widths", type=int, nargs="+", default=[1, 5, 20, 50], help="Arbitrage lanes per graph")
    parser.add_argument("--iterations", type=int, default=500, help="Timed run_tick() calls per width")
    parser.add_argument("--out", type=Path, default=None, help="Write results as JSON to this path")
    args = parser.parse_args()

    results = run(args.widths, args.iterations)
    print_table(results)

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(
            json.dumps({"run_at": datetime.now(timezone.utc).isoformat(), "results": results}, indent=2)
        )
        print(f"\nWrote {args.out}")


if __name__ == "__main__":
    main()
