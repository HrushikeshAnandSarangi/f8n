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
    """Reddit + news sentiment for a ticker (VADER + a finance/crypto lexicon - see
    app/sentiment_engine/pipeline.py). Each data source is independently toggleable;
    RSS news needs no API key at all, the others are free but need a key/app to enable."""

    spec = BlockSpec(
        type="source.sentiment",
        category="source",
        label="Sentiment Score",
        description="Reddit + news sentiment breakdown for a ticker, from independently configurable free sources.",
        config_schema={
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "default": "BTC-USD"},
                "use_reddit": {"type": "boolean", "default": True},
                "use_rss_news": {"type": "boolean", "default": True},
                "use_cryptopanic": {"type": "boolean", "default": False},
                "use_yahoo_finance": {"type": "boolean", "default": False},
            },
            "required": ["ticker"],
        },
        inputs=[],
        outputs=[Port("reddit", "Reddit %", "object"), Port("news", "News %", "object")],
        # Sentiment sources are scraped, not streamed - polling every few seconds would
        # hammer Reddit/RSS/Yahoo for no benefit, so this is minutes, not seconds.
        poll_interval_seconds=600,
    )

    def execute(self, config, inputs, ctx):
        sources = {
            "reddit": config.get("use_reddit", True),
            "rss_news": config.get("use_rss_news", True),
            "cryptopanic": config.get("use_cryptopanic", False),
            "yahoo_finance": config.get("use_yahoo_finance", False),
        }
        data = ctx.get_sentiment(config["ticker"], sources=sources) or {}
        return {"reddit": data.get("reddit"), "news": data.get("news")}
