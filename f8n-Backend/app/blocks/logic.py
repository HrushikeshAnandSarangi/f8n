from .base import BaseBlock, BlockSpec, Port
from .registry import register_block

_OPERATORS = {
    ">": lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
    "<": lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
}


@register_block
class ThresholdBlock(BaseBlock):
    spec = BlockSpec(
        type="logic.threshold",
        category="logic",
        label="Threshold",
        description="Compares an input value against a configured operator/threshold.",
        config_schema={
            "type": "object",
            "properties": {
                "operator": {"type": "string", "enum": list(_OPERATORS.keys()), "default": ">="},
                "threshold": {"type": "number", "default": 0.5},
            },
            "required": ["operator", "threshold"],
        },
        inputs=[Port("value", "Value", "number")],
        outputs=[Port("triggered", "Triggered", "boolean")],
    )

    def execute(self, config, inputs, ctx):
        value = inputs.get("value")
        if value is None:
            return {"triggered": False}
        op = _OPERATORS[config.get("operator", ">=")]
        return {"triggered": bool(op(value, config.get("threshold", 0)))}


def _make_bool_combiner_block(type_name, label, combine):
    @register_block
    class _CombinerBlock(BaseBlock):
        spec = BlockSpec(
            type=type_name,
            category="logic",
            label=label,
            description=f"{label} of two boolean inputs.",
            config_schema={"type": "object", "properties": {}},
            inputs=[Port("a", "A", "boolean"), Port("b", "B", "boolean")],
            outputs=[Port("result", "Result", "boolean")],
        )

        def execute(self, config, inputs, ctx):
            return {"result": combine(bool(inputs.get("a")), bool(inputs.get("b")))}

    _CombinerBlock.__name__ = type_name.replace(".", "_")
    return _CombinerBlock


AndBlock = _make_bool_combiner_block("logic.and", "AND", lambda a, b: a and b)
OrBlock = _make_bool_combiner_block("logic.or", "OR", lambda a, b: a or b)
