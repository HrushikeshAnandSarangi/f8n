from app.blocks.actions import LogBlock, PaperBuyBlock
from app.blocks.indicators import SentimentScoreBlock, SpreadPctBlock
from app.blocks.logic import AndBlock, OrBlock, ThresholdBlock


def test_spread_pct_basic():
    result = SpreadPctBlock().execute({}, {"price_a": 100.0, "price_b": 101.5}, ctx=None)
    assert round(result["spread_pct"], 4) == 1.5


def test_spread_pct_handles_zero_price_a():
    result = SpreadPctBlock().execute({}, {"price_a": 0, "price_b": 100.0}, ctx=None)
    assert result["spread_pct"] is None


def test_spread_pct_handles_missing_price_b():
    result = SpreadPctBlock().execute({}, {"price_a": 100.0, "price_b": None}, ctx=None)
    assert result["spread_pct"] is None


def test_sentiment_score():
    result = SentimentScoreBlock().execute(
        {}, {"sentiment": {"positive": 60, "negative": 10, "neutral": 30}}, ctx=None
    )
    assert result["score"] == 50


def test_threshold_triggers_above_and_not_below():
    block = ThresholdBlock()
    config = {"operator": ">=", "threshold": 1.0}
    assert block.execute(config, {"value": 1.5}, ctx=None)["triggered"] is True
    assert block.execute(config, {"value": 0.5}, ctx=None)["triggered"] is False


def test_threshold_missing_value_does_not_trigger():
    result = ThresholdBlock().execute({"operator": ">=", "threshold": 1.0}, {"value": None}, ctx=None)
    assert result["triggered"] is False


def test_and_or_combinators():
    assert AndBlock().execute({}, {"a": True, "b": False}, ctx=None)["result"] is False
    assert AndBlock().execute({}, {"a": True, "b": True}, ctx=None)["result"] is True
    assert OrBlock().execute({}, {"a": True, "b": False}, ctx=None)["result"] is True
    assert OrBlock().execute({}, {"a": False, "b": False}, ctx=None)["result"] is False


def test_paper_buy_action_passes_through_config_when_triggered():
    result = PaperBuyBlock().execute(
        {"exchange": "binance", "symbol": "BTC/USDT", "quantity": 0.01, "fee_pct": 0.001},
        {"trigger": True},
        ctx=None,
    )
    assert result == {
        "triggered": True,
        "action": "buy",
        "exchange": "binance",
        "symbol": "BTC/USDT",
        "quantity": 0.01,
        "fee_pct": 0.001,
    }


def test_paper_buy_action_is_a_no_op_when_not_triggered():
    result = PaperBuyBlock().execute(
        {"exchange": "binance", "symbol": "BTC/USDT", "quantity": 0.01}, {"trigger": False}, ctx=None
    )
    assert result == {"triggered": False}


def test_log_block_calls_ctx_log():
    calls = []

    class FakeCtx:
        def log(self, message, level="info"):
            calls.append((message, level))

    LogBlock().execute({"label": "note"}, {"message": "hello"}, ctx=FakeCtx())
    assert calls == [("note: hello", "info")]
