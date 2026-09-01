from .base import BaseBlock, BlockSpec, Port
from .registry import register_block


def _make_order_action_block(type_name, label, side):
    @register_block
    class _OrderActionBlock(BaseBlock):
        spec = BlockSpec(
            type=type_name,
            category="action",
            label=label,
            description=f"Places a paper {side} order when triggered.",
            config_schema={
                "type": "object",
                "properties": {
                    "exchange": {"type": "string", "default": "binance"},
                    "symbol": {"type": "string", "default": "BTC/USDT"},
                    "quantity": {"type": "number", "default": 0.001},
                    "fee_pct": {"type": "number", "default": 0.001},
                },
                "required": ["exchange", "symbol", "quantity"],
            },
            inputs=[Port("trigger", "Trigger", "boolean")],
            outputs=[Port("triggered", "Triggered", "boolean")],
        )

        def execute(self, config, inputs, ctx):
            if not inputs.get("trigger"):
                return {"triggered": False}
            return {
                "triggered": True,
                "action": side,
                "exchange": config["exchange"],
                "symbol": config["symbol"],
                "quantity": config["quantity"],
                "fee_pct": config.get("fee_pct", 0.001),
            }

    _OrderActionBlock.__name__ = type_name.replace(".", "_")
    return _OrderActionBlock


PaperBuyBlock = _make_order_action_block("action.paper_buy", "Paper Buy", "buy")
PaperSellBlock = _make_order_action_block("action.paper_sell", "Paper Sell", "sell")


@register_block
class LogBlock(BaseBlock):
    spec = BlockSpec(
        type="action.log",
        category="action",
        label="Log",
        description="Records a note on the run's activity feed.",
        config_schema={
            "type": "object",
            "properties": {"label": {"type": "string", "default": "note"}},
        },
        inputs=[Port("message", "Message", "object")],
        outputs=[],
    )

    def execute(self, config, inputs, ctx):
        ctx.log(f"{config.get('label', 'note')}: {inputs.get('message')}")
        return {}
