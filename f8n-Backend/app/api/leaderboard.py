from flask import Blueprint, jsonify

from app.models.backtest import BacktestRun
from app.models.paper_trading import PaperSession
from app.models.strategy import Strategy

leaderboard_bp = Blueprint("leaderboard", __name__)


@leaderboard_bp.get("")
def get_leaderboard():
    """Ranks every agent that has at least one completed backtest by its best
    total_return_pct, with its live paper P&L alongside if a session is running -
    a cross-agent view none of the per-agent pages give you. No accounts here, so
    this is just every agent anyone has ever backtested, same open-by-design model
    as the rest of the API."""
    rows = []
    for strategy in Strategy.query.all():
        done_runs = [
            run
            for run in BacktestRun.query.filter_by(strategy_id=strategy.id, status="done").all()
            if run.summary_json
        ]
        if not done_runs:
            continue  # nothing to rank this agent on yet

        best_run = max(done_runs, key=lambda run: run.summary_json["total_return_pct"])

        live_session = (
            PaperSession.query.filter_by(strategy_id=strategy.id, status="running")
            .order_by(PaperSession.created_at.desc())
            .first()
        )
        live = None
        if live_session:
            equity_points = live_session.equity_points
            latest_equity = equity_points[-1].equity if equity_points else live_session.starting_capital
            starting_capital = live_session.starting_capital
            live = {
                "session_id": live_session.id,
                "equity": latest_equity,
                "pnl": latest_equity - starting_capital,
                "pnl_pct": ((latest_equity - starting_capital) / starting_capital * 100.0) if starting_capital else 0.0,
            }

        rows.append(
            {
                "strategy_id": strategy.id,
                "strategy_name": strategy.name,
                "backtests_run": len(done_runs),
                "best_backtest": {
                    "id": best_run.id,
                    "total_return_pct": best_run.summary_json["total_return_pct"],
                    "sharpe_ratio": best_run.summary_json["sharpe_ratio"],
                    "max_drawdown_pct": best_run.summary_json["max_drawdown_pct"],
                    "win_rate_pct": best_run.summary_json["win_rate_pct"],
                    "trade_count": best_run.summary_json["trade_count"],
                },
                "live": live,
            }
        )

    rows.sort(key=lambda row: row["best_backtest"]["total_return_pct"], reverse=True)
    return jsonify(rows)
