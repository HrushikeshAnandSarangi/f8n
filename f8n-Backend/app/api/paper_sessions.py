from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.models.paper_trading import PaperSession
from app.papertrading import manager

from .strategies import get_strategy_or_404

paper_sessions_bp = Blueprint("paper_sessions", __name__)


@paper_sessions_bp.post("")
def start_paper_session():
    data = request.get_json(force=True) or {}
    strategy = get_strategy_or_404(data.get("strategy_id"))

    session = PaperSession(
        strategy_id=strategy.id,
        graph_json=strategy.graph_json,
        starting_capital=float(data.get("starting_capital", 10000.0)),
        status="running",
    )
    db.session.add(session)
    db.session.commit()

    manager.start_session(current_app._get_current_object(), session.id)
    return jsonify(session.to_dict()), 202


@paper_sessions_bp.post("/<int:session_id>/stop")
def stop_paper_session(session_id):
    PaperSession.query.get_or_404(session_id)
    manager.stop_session(session_id)
    return jsonify({"status": "stopping"}), 202


@paper_sessions_bp.get("")
def list_paper_sessions():
    sessions = PaperSession.query.order_by(PaperSession.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions])


@paper_sessions_bp.get("/<int:session_id>")
def get_paper_session(session_id):
    session = PaperSession.query.get_or_404(session_id)
    return jsonify(session.to_dict(include_details=True))
