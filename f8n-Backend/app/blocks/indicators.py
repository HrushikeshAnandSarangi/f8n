from .base import BaseBlock, BlockSpec, Port
from .registry import register_block


@register_block
class SpreadPctBlock(BaseBlock):
    spec = BlockSpec(
        type="indicator.spread_pct",
        category="indicator",
        label="Spread %",
        description="Percentage difference between two prices: (price_b - price_a) / price_a * 100.",
        config_schema={"type": "object", "properties": {}},
        inputs=[Port("price_a", "Price A", "number"), Port("price_b", "Price B", "number")],
        outputs=[Port("spread_pct", "Spread %", "number")],
    )

    def execute(self, config, inputs, ctx):
        price_a = inputs.get("price_a")
        price_b = inputs.get("price_b")
        if not price_a or price_b is None:
            return {"spread_pct": None}
        return {"spread_pct": (price_b - price_a) / price_a * 100.0}


@register_block
class SentimentScoreBlock(BaseBlock):
    spec = BlockSpec(
        type="indicator.sentiment_score",
        category="indicator",
        label="Sentiment Score",
        description="Reduces a positive/negative/neutral breakdown to one scalar (positive - negative).",
        config_schema={"type": "object", "properties": {}},
        inputs=[Port("sentiment", "Sentiment %", "object")],
        outputs=[Port("score", "Score", "number")],
    )

    def execute(self, config, inputs, ctx):
        sentiment = inputs.get("sentiment") or {}
        score = float(sentiment.get("positive", 0) or 0) - float(sentiment.get("negative", 0) or 0)
        return {"score": score}
