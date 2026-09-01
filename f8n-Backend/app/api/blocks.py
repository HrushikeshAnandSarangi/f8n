from flask import Blueprint, jsonify

from app.blocks.registry import all_specs

blocks_bp = Blueprint("blocks", __name__)


@blocks_bp.get("/")
def list_blocks():
    """Backs the frontend's node palette - one source of truth for what blocks exist."""
    return jsonify(all_specs())
