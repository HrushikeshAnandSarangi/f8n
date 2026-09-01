from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models.strategy import Strategy

strategies_bp = Blueprint("strategies", __name__)


@strategies_bp.get("")
def list_strategies():
    items = Strategy.query.order_by(Strategy.updated_at.desc()).all()
    return jsonify([s.to_dict(include_graph=False) for s in items])


@strategies_bp.post("")
def create_strategy():
    data = request.get_json(force=True) or {}
    strategy = Strategy(
        name=data.get("name") or "Untitled Agent",
        description=data.get("description"),
        graph_json=data.get("graph") or {"nodes": [], "edges": []},
    )
    db.session.add(strategy)
    db.session.commit()
    return jsonify(strategy.to_dict()), 201


@strategies_bp.get("/<int:strategy_id>")
def get_strategy(strategy_id):
    return jsonify(get_strategy_or_404(strategy_id).to_dict())


@strategies_bp.put("/<int:strategy_id>")
def update_strategy(strategy_id):
    strategy = get_strategy_or_404(strategy_id)
    data = request.get_json(force=True) or {}
    if "name" in data:
        strategy.name = data["name"]
    if "description" in data:
        strategy.description = data["description"]
    if "graph" in data:
        strategy.graph_json = data["graph"]
    db.session.commit()
    return jsonify(strategy.to_dict())


@strategies_bp.delete("/<int:strategy_id>")
def delete_strategy(strategy_id):
    strategy = get_strategy_or_404(strategy_id)
    db.session.delete(strategy)
    db.session.commit()
    return "", 204


def get_strategy_or_404(strategy_id) -> Strategy:
    """Shared by the backtests/paper-sessions blueprints too - this is a no-account
    tool, so any agent is visible/runnable by anyone with its id, same as the rest
    of the API."""
    return Strategy.query.get_or_404(strategy_id)
