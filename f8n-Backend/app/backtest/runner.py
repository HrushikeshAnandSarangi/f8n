from datetime import datetime

from app.execution.portfolio import Portfolio
from app.extensions import db
from app.graph.engine import GraphEngine
from app.graph.execution_context import HistoricalContext
from app.marketdata.historical import get_ohlcv_frame
from app.models.backtest import BacktestEquityPoint, BacktestRun, BacktestTrade
from app.models.sentiment import SentimentSnapshot

from .metrics import compute_summary


class BacktestError(Exception):
    pass


def run_backtest(app, run_id):
    """Entry point submitted to the background thread pool by POST /api/backtests."""
    with app.app_context():
        run = BacktestRun.query.get(run_id)
        if not run:
            return
        run.status = "running"
        db.session.commit()

        try:
            _execute(run)
            run.status = "done"
        except Exception as exc:  # noqa: BLE001 - surface any failure on the run record
            db.session.rollback()
            run = BacktestRun.query.get(run_id)
            run.status = "failed"
            run.error = str(exc)
        finally:
            run.finished_at = datetime.utcnow()
            db.session.commit()


def _execute(run: BacktestRun):
    graph = run.strategy.graph_json
    pairs = exchange_symbol_pairs(graph)
    if not pairs:
        raise BacktestError("Strategy has no exchange price source blocks to backtest against")

    frames = {
        pair: get_ohlcv_frame(exchange=pair[0], symbol=pair[1], timeframe="1m", start=run.start_date, end=run.end_date)
        for pair in pairs
    }
    if all(frame.empty for frame in frames.values()):
        raise BacktestError("No historical data was returned for the configured symbols/date range")

    ctx = HistoricalContext(
        price_frames=frames,
        sentiment_snapshots=_sentiment_lookup(graph, run.start_date, run.end_date),
    )
    portfolio = Portfolio(run.starting_capital)
    engine = GraphEngine()

    timeline = sorted(set().union(*(set(frame.index) for frame in frames.values() if not frame.empty)))
    for ts in timeline:
        ctx.advance_to(ts)
        for signal in engine.run_tick(graph, ctx):
            _apply_signal(run, ts, ctx, portfolio, signal)
        db.session.add(BacktestEquityPoint(run_id=run.id, timestamp=ts, equity=portfolio.equity(ctx.get_price)))

    db.session.commit()
    run.summary_json = compute_summary(run.trades, run.equity_points, run.starting_capital)


def exchange_symbol_pairs(graph):
    """Also used by GET /api/backtests/<id>/candles to know which OHLCV series
    to read back out of the cache this same run populated."""
    pairs = set()
    for node in graph.get("nodes", []):
        if node.get("type") == "source.exchange_ticker":
            config = node.get("config", {})
            if config.get("exchange") and config.get("symbol"):
                pairs.add((config["exchange"], config["symbol"]))
    return pairs


def _sentiment_lookup(graph, start, end):
    tickers = {
        node["config"]["ticker"]
        for node in graph.get("nodes", [])
        if node.get("type") == "source.sentiment" and node.get("config", {}).get("ticker")
    }
    lookup = {}
    for ticker in tickers:
        rows = (
            SentimentSnapshot.query.filter(
                SentimentSnapshot.ticker == ticker,
                SentimentSnapshot.timestamp >= start,
                SentimentSnapshot.timestamp <= end,
            )
            .order_by(SentimentSnapshot.timestamp)
            .all()
        )
        by_timestamp = {}
        for row in rows:
            entry = by_timestamp.setdefault(row.timestamp, {"reddit": None, "news": None})
            entry[row.source] = {"positive": row.positive, "negative": row.negative, "neutral": row.neutral}
        lookup[ticker] = sorted(by_timestamp.items())
    return lookup


def _apply_signal(run, ts, ctx, portfolio, signal):
    exchange, symbol = signal["exchange"], signal["symbol"]
    price = ctx.get_price(exchange, symbol)
    if price is None:
        return

    action = signal["action"]
    fee_pct = signal.get("fee_pct", 0.001)
    quantity = signal["quantity"]
    result = (
        portfolio.apply_buy(exchange, symbol, price, quantity, fee_pct)
        if action == "buy"
        else portfolio.apply_sell(exchange, symbol, price, quantity, fee_pct)
    )
    if result is None:
        return

    db.session.add(
        BacktestTrade(
            run_id=run.id,
            timestamp=ts,
            symbol=symbol,
            side=action,
            exchange=exchange,
            price=price,
            quantity=quantity,
            fee=result["fee"],
            pnl=result["pnl"],
        )
    )
