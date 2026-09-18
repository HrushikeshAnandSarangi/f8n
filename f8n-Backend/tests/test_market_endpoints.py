from datetime import datetime

from app.extensions import db
from app.models.backtest import BacktestRun
from app.models.market_data import OHLCVCache
from app.models.paper_trading import PaperEquityPoint, PaperSession
from app.models.strategy import Strategy


def _arbitrage_graph():
    return {
        "nodes": [
            {"id": "a", "type": "source.exchange_ticker", "config": {"exchange": "binance", "symbol": "BTC/USDT"}},
            {"id": "b", "type": "source.exchange_ticker", "config": {"exchange": "kraken", "symbol": "BTC/USDT"}},
        ],
        "edges": [],
    }


def _make_strategy(name="Agent"):
    strategy = Strategy(name=name, graph_json=_arbitrage_graph())
    db.session.add(strategy)
    db.session.commit()
    return strategy


def _make_done_backtest(strategy, total_return_pct):
    run = BacktestRun(
        strategy_id=strategy.id,
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 1, 2),
        starting_capital=10000.0,
        status="done",
        summary_json={
            "starting_capital": 10000.0,
            "ending_equity": 10000.0 * (1 + total_return_pct / 100.0),
            "total_return_pct": total_return_pct,
            "max_drawdown_pct": 1.0,
            "win_rate_pct": 50.0,
            "trade_count": 2,
            "total_fees": 0.5,
            "sharpe_ratio": 0.8,
        },
    )
    db.session.add(run)
    db.session.commit()
    return run


def test_backtest_candles_returns_cached_bars_per_pair(client):
    strategy = _make_strategy()
    run = _make_done_backtest(strategy, total_return_pct=2.0)

    db.session.add(
        OHLCVCache(
            exchange="binance",
            symbol="BTC/USDT",
            timeframe="1m",
            timestamp=datetime(2024, 1, 1, 0, 1),
            open=100.0,
            high=101.0,
            low=99.0,
            close=100.5,
            volume=10.0,
        )
    )
    db.session.commit()

    resp = client.get(f"/api/backtests/{run.id}/candles")
    assert resp.status_code == 200
    candles = resp.get_json()["candles"]

    assert set(candles.keys()) == {"binance:BTC/USDT", "kraken:BTC/USDT"}
    assert candles["kraken:BTC/USDT"] == []
    assert len(candles["binance:BTC/USDT"]) == 1
    bar = candles["binance:BTC/USDT"][0]
    assert bar["open"] == 100.0 and bar["close"] == 100.5


def test_leaderboard_ranks_by_best_return_and_includes_live_pnl(client):
    strong = _make_strategy("Strong Agent")
    _make_done_backtest(strong, total_return_pct=5.0)

    weak = _make_strategy("Weak Agent")
    _make_done_backtest(weak, total_return_pct=1.0)

    untested = _make_strategy("Untested Agent")

    session = PaperSession(strategy_id=strong.id, graph_json=_arbitrage_graph(), starting_capital=10000.0, status="running")
    db.session.add(session)
    db.session.commit()
    db.session.add(PaperEquityPoint(session_id=session.id, timestamp=datetime(2024, 1, 1), equity=10300.0))
    db.session.commit()

    resp = client.get("/api/leaderboard")
    assert resp.status_code == 200
    rows = resp.get_json()

    assert [r["strategy_id"] for r in rows] == [strong.id, weak.id]  # untested agent excluded, ranked descending
    assert rows[0]["live"]["pnl"] == 300.0
    assert rows[1]["live"] is None
