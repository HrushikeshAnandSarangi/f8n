from .base import BaseBlock, BlockSpec, Port
from .registry import register_block

SUPPORTED_EXCHANGES = ["binance", "kraken", "coinbase", "kucoin", "bybit"]


@register_block
class ExchangeTickerBlock(BaseBlock):
    """The pluggable market-data adapter: swap `exchange` to point this block at a
    different source without touching the rest of the graph."""

    spec = BlockSpec(
        type="source.exchange_ticker",
        category="source",
        label="Exchange Price",
        description="Live/historical last-traded price for a symbol on one exchange.",
        config_schema={
            "type": "object",
            "properties": {
                "exchange": {"type": "string", "enum": SUPPORTED_EXCHANGES, "default": "binance"},
                "symbol": {"type": "string", "default": "BTC/USDT"},
            },
            "required": ["exchange", "symbol"],
        },
        inputs=[],
        outputs=[Port("price", "Price", "number")],
        poll_interval_seconds=5,
    )

    def execute(self, config, inputs, ctx):
        price = ctx.get_price(config["exchange"], config["symbol"])
        return {"price": price}


@register_block
class SentimentBlock(BaseBlock):
    """Reddit + news sentiment for a ticker, backed by the ported financial-sentiment
    pipeline (see app/sentiment_engine/pipeline.py)."""

    spec = BlockSpec(
        type="source.sentiment",
        category="source",
        label="Sentiment Score",
        description="Reddit + news sentiment breakdown for a ticker (financial-tuned NLP model).",
        config_schema={
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "default": "BTC-USD"},
            },
            "required": ["ticker"],
        },
        inputs=[],
        outputs=[Port("reddit", "Reddit %", "object"), Port("news", "News %", "object")],
        # Sentiment sources are scraped, not streamed - polling every few seconds would
        # hammer Reddit/Yahoo for no benefit, so this is minutes, not seconds.
        poll_interval_seconds=600,
    )

    def execute(self, config, inputs, ctx):
        data = ctx.get_sentiment(config["ticker"]) or {}
        return {"reddit": data.get("reddit"), "news": data.get("news")}
