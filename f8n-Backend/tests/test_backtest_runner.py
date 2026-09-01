from datetime import datetime, timedelta

import pandas as pd

from app.execution.portfolio import Portfolio
from app.graph.engine import GraphEngine
from app.graph.execution_context import HistoricalContext


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
                "config": {"exchange": "binance", "symbol": "BTC/USDT", "quantity": 1.0, "fee_pct": 0.0},
            },
        ],
        "edges": [
            {"source": "a", "sourceHandle": "price", "target": "spread", "targetHandle": "price_a"},
            {"source": "b", "sourceHandle": "price", "target": "spread", "targetHandle": "price_b"},
            {"source": "spread", "sourceHandle": "spread_pct", "target": "gate", "targetHandle": "value"},
            {"source": "gate", "sourceHandle": "triggered", "target": "buy", "targetHandle": "trigger"},
        ],
    }


def test_backtest_replay_buys_while_spread_persists_and_keeps_equity_flat():
    """A minimal, DB-free replay of what app/backtest/runner.py does per tick: no fees,
    so buying at the fair market price should never change total equity - only convert
    cash into an equally-valued position. This pins the Portfolio/GraphEngine/
    HistoricalContext math the real runner depends on.
    """
    start = datetime(2024, 1, 1)
    times = [start + timedelta(minutes=i) for i in range(3)]
    binance_prices = pd.Series([100.0, 100.0, 100.0], index=times)
    kraken_prices = pd.Series([100.0, 102.0, 102.0], index=times)  # 2% spread appears at t1, holds at t2

    ctx = HistoricalContext(
        price_frames={
            ("binance", "BTC/USDT"): binance_prices,
            ("kraken", "BTC/USDT"): kraken_prices,
        }
    )
    portfolio = Portfolio(starting_capital=10000.0)
    engine = GraphEngine()
    graph = _arbitrage_graph()

    trade_count = 0
    equity_curve = []
    for ts in times:
        ctx.advance_to(ts)
        for signal in engine.run_tick(graph, ctx):
            price = ctx.get_price(signal["exchange"], signal["symbol"])
            result = portfolio.apply_buy(signal["exchange"], signal["symbol"], price, signal["quantity"], signal["fee_pct"])
            if result:
                trade_count += 1
        equity_curve.append(portfolio.equity(ctx.get_price))

    # Threshold has no "fire once" debounce in the MVP block set, so it keeps buying
    # every tick the opportunity persists (t1 and t2) - that's expected, not a bug.
    assert trade_count == 2
    assert portfolio.positions[("binance", "BTC/USDT")]["qty"] == 2.0
    assert equity_curve == [10000.0, 10000.0, 10000.0]


def test_portfolio_sell_realizes_pnl_against_average_cost():
    portfolio = Portfolio(starting_capital=1000.0)
    portfolio.apply_buy("binance", "BTC/USDT", price=100.0, quantity=2.0, fee_pct=0.0)
    result = portfolio.apply_sell("binance", "BTC/USDT", price=110.0, quantity=1.0, fee_pct=0.0)

    assert result["pnl"] == 10.0  # sold 1 unit bought at 100 for 110
    assert portfolio.positions[("binance", "BTC/USDT")]["qty"] == 1.0
    assert portfolio.cash == 1000.0 - 200.0 + 110.0


def test_portfolio_rejects_buy_beyond_available_cash():
    portfolio = Portfolio(starting_capital=50.0)
    result = portfolio.apply_buy("binance", "BTC/USDT", price=100.0, quantity=1.0, fee_pct=0.0)
    assert result is None
    assert portfolio.cash == 50.0


def test_portfolio_rejects_sell_beyond_held_position():
    portfolio = Portfolio(starting_capital=1000.0)
    result = portfolio.apply_sell("binance", "BTC/USDT", price=100.0, quantity=1.0, fee_pct=0.0)
    assert result is None
