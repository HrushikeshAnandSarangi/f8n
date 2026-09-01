import pytest

from app.graph.engine import GraphEngine


class StaticPriceContext:
    def __init__(self, prices):
        self.prices = prices
        self.logs = []

    def get_price(self, exchange, symbol):
        return self.prices.get((exchange, symbol))

    def get_sentiment(self, ticker):
        return {"positive": 0, "negative": 0, "neutral": 100}

    def log(self, message, level="info"):
        self.logs.append((level, message))


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


def test_engine_emits_signal_when_spread_exceeds_threshold():
    ctx = StaticPriceContext({("binance", "BTC/USDT"): 100.0, ("kraken", "BTC/USDT"): 102.0})
    signals = GraphEngine().run_tick(_arbitrage_graph(), ctx)
    assert len(signals) == 1
    assert signals[0]["action"] == "buy"
    assert signals[0]["quantity"] == 0.01


def test_engine_emits_no_signal_when_spread_below_threshold():
    ctx = StaticPriceContext({("binance", "BTC/USDT"): 100.0, ("kraken", "BTC/USDT"): 100.2})
    signals = GraphEngine().run_tick(_arbitrage_graph(), ctx)
    assert signals == []


def test_engine_detects_cycles():
    graph = {
        "nodes": [{"id": "x", "type": "logic.threshold", "config": {"operator": ">=", "threshold": 1}}],
        "edges": [{"source": "x", "sourceHandle": "triggered", "target": "x", "targetHandle": "value"}],
    }
    with pytest.raises(ValueError):
        GraphEngine().run_tick(graph, StaticPriceContext({}))
