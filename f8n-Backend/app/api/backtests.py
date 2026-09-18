from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from flask import Blueprint, current_app, jsonify, request

from app.backtest.runner import exchange_symbol_pairs, run_backtest
from app.extensions import db
from app.marketdata.historical import get_cached_candles
from app.models.backtest import BacktestRun

from .strategies import get_strategy_or_404

backtests_bp = Blueprint("backtests", __name__)

# Small, in-process pool so a backtest doesn't block the request that started it.
# See app/papertrading/manager.py for why this stays thread-based rather than Celery.
_executor = ThreadPoolExecutor(max_workers=2)


@backtests_bp.post("")
def start_backtest():
    data = request.get_json(force=True) or {}
    strategy = get_strategy_or_404(data.get("strategy_id"))

    run = BacktestRun(
        strategy_id=strategy.id,
        start_date=datetime.fromisoformat(data["start_date"]),
        end_date=datetime.fromisoformat(data["end_date"]),
        starting_capital=float(data.get("starting_capital", 10000.0)),
        status="pending",
    )
    db.session.add(run)
    db.session.commit()

    _executor.submit(run_backtest, current_app._get_current_object(), run.id)
    return jsonify(run.to_dict()), 202


@backtests_bp.get("")
def list_backtests():
    runs = BacktestRun.query.order_by(BacktestRun.created_at.desc()).all()
    return jsonify([r.to_dict() for r in runs])


@backtests_bp.get("/<int:run_id>")
def get_backtest(run_id):
    run = BacktestRun.query.get_or_404(run_id)
    return jsonify(run.to_dict(include_details=True))


@backtests_bp.get("/<int:run_id>/candles")
def get_backtest_candles(run_id):
    """OHLC bars for every exchange price source in the strategy, over the run's
    date range - the same 1m timeframe _execute() cached them at. Charts the
    price the strategy actually saw alongside its trades on the backtest page."""
    run = BacktestRun.query.get_or_404(run_id)
    pairs = exchange_symbol_pairs(run.strategy.graph_json)

    candles = {
        f"{exchange}:{symbol}": get_cached_candles(exchange, symbol, "1m", run.start_date, run.end_date)
        for exchange, symbol in pairs
    }
    return jsonify({"candles": candles})
