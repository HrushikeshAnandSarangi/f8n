from dataclasses import dataclass, field


@dataclass
class Port:
    name: str
    label: str
    data_type: str  # "number" | "boolean" | "object"


@dataclass
class BlockSpec:
    type: str
    category: str  # source | indicator | logic | action
    label: str
    description: str
    config_schema: dict
    inputs: list = field(default_factory=list)
    outputs: list = field(default_factory=list)
    # Only meaningful for "source" blocks when run live (paper trading): how often the
    # block's underlying data should actually be re-fetched rather than reused from cache.
    poll_interval_seconds: int = None

    def to_dict(self):
        return {
            "type": self.type,
            "category": self.category,
            "label": self.label,
            "description": self.description,
            "config_schema": self.config_schema,
            "inputs": [vars(p) for p in self.inputs],
            "outputs": [vars(p) for p in self.outputs],
            "poll_interval_seconds": self.poll_interval_seconds,
        }


class BaseBlock:
    """One node in a strategy graph. Stateless: all state for a run lives on `ctx`."""

    spec: BlockSpec = None

    def execute(self, config: dict, inputs: dict, ctx) -> dict:
        """Return a dict of output values keyed by output port name."""
        raise NotImplementedError
