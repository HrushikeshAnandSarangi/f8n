_REGISTRY = {}


def register_block(block_cls):
    """Class decorator: adds a block to the registry keyed by its spec.type.

    This registry is the single source of truth for what blocks exist - it backs both
    GET /api/blocks (the frontend's node palette) and the graph engine's node execution,
    so the two can never drift out of sync.
    """
    _REGISTRY[block_cls.spec.type] = block_cls
    return block_cls


def get_block(block_type):
    try:
        return _REGISTRY[block_type]
    except KeyError as exc:
        raise ValueError(f"Unknown block type: {block_type}") from exc


def all_specs():
    return [cls.spec.to_dict() for cls in _REGISTRY.values()]
