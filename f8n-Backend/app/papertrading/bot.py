"""The live counterpart to app/backtest/runner.py - same graph, same Portfolio
accounting, fed by LiveContext (live polls) instead of HistoricalContext (replay).

Binance is the only leg that can ever place a real order, and only ever against the
Binance **Testnet** (fake money). Every other exchange leg - and Binance itself if no
testnet keys are configured - is a simulated fill against the real live price. No code
path here can place a real-money order.
"""

import logging
import os
from datetime import datetime

from app.execution.portfolio import Portfolio
from app.extensions import db, socketio
from app.graph.engine import GraphEngine
from app.graph.execution_context import LiveContext
from app.models.paper_trading import ActivityLogEntry, PaperEquityPoint, PaperSession, PaperTrade

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 5


def run_paper_session(app, session_id, stop_event):
    with app.app_context():
        session = PaperSession.query.get(session_id)
        if not session:
            return

        portfolio = Portfolio(session.starting_capital)
        engine = GraphEngine()

        def on_log(message, level="info"):
            _record_log(session_id, message, level)

        try:
            while not stop_event.is_set():
                ctx = LiveContext(session_id=session_id, on_log=on_log)
                try:
                    signals = engine.run_tick(session.graph_json, ctx)
                    for signal in signals:
                        _apply_signal(session_id, portfolio, signal, on_log)
                    _record_equity(session_id, portfolio.equity(ctx.get_price))
                except Exception as exc:  # noqa: BLE001 - one bad tick shouldn't kill the session
                    logger.exception("Paper session %s tick failed", session_id)
                    on_log(f"Tick failed, will retry: {exc}", "warn")
                stop_event.wait(POLL_INTERVAL_SECONDS)
        except Exception as exc:  # noqa: BLE001
            session = PaperSession.query.get(session_id)
            session.status = "error"
            session.error = str(exc)
            session.stopped_at = datetime.utcnow()
            db.session.commit()
            on_log(f"Session stopped due to error: {exc}", "error")
        else:
            session = PaperSession.query.get(session_id)
            if session and session.status == "running":
                session.status = "stopped"
                session.stopped_at = datetime.utcnow()
                db.session.commit()
                on_log("Session stopped", "info")


def _get_binance_testnet_client():
    import ccxt

    client = ccxt.binance(
        {
            "apiKey": os.environ.get("BINANCE_TESTNET_API_KEY"),
            "secret": os.environ.get("BINANCE_TESTNET_SECRET"),
            "enableRateLimit": True,
        }
    )
    client.set_sandbox_mode(True)
    return client


def _apply_signal(session_id, portfolio, signal, on_log):
    exchange, symbol = signal["exchange"], signal["symbol"]
    quantity, fee_pct, action = signal["quantity"], signal.get("fee_pct", 0.001), signal["action"]

    order_id, price, is_testnet_order = None, None, False

    if exchange == "binance" and os.environ.get("BINANCE_TESTNET_API_KEY"):
        try:
            client = _get_binance_testnet_client()
            order = client.create_order(symbol, "market", action, quantity)
            order_id = order.get("id")
            price = float(order.get("average") or order.get("price") or 0) or None
            is_testnet_order = True
        except Exception as exc:  # noqa: BLE001
            on_log(f"Binance testnet order failed, falling back to a simulated fill: {exc}", "warn")

    if price is None:
        from app.marketdata.ccxt_client import fetch_ticker_price

        price = fetch_ticker_price(exchange, symbol)

    result = (
        portfolio.apply_buy(exchange, symbol, price, quantity, fee_pct)
        if action == "buy"
        else portfolio.apply_sell(exchange, symbol, price, quantity, fee_pct)
    )
    if result is None:
        on_log(f"Skipped {action} {quantity} {symbol} on {exchange}: insufficient paper funds/position", "warn")
        return

    _record_trade(session_id, symbol, action, exchange, price, quantity, result["fee"], is_testnet_order, order_id, result["pnl"])
    tag = "TESTNET" if is_testnet_order else "PAPER"
    on_log(f"{tag} {action.upper()} {quantity} {symbol} @ {price} on {exchange}", "trade")


def _record_trade(session_id, symbol, side, exchange, price, quantity, fee, is_testnet_order, order_id, pnl):
    trade = PaperTrade(
        session_id=session_id,
        timestamp=datetime.utcnow(),
        symbol=symbol,
        side=side,
        exchange=exchange,
        price=price,
        quantity=quantity,
        fee=fee,
        is_testnet_order=is_testnet_order,
        order_id=order_id,
        pnl=pnl,
    )
    db.session.add(trade)
    db.session.commit()
    socketio.emit("paper_trade", trade.to_dict(), room=f"session_{session_id}")


def _record_equity(session_id, equity):
    point = PaperEquityPoint(session_id=session_id, timestamp=datetime.utcnow(), equity=equity)
    db.session.add(point)
    db.session.commit()
    socketio.emit("paper_equity", point.to_dict(), room=f"session_{session_id}")


def _record_log(session_id, message, level):
    entry = ActivityLogEntry(session_id=session_id, timestamp=datetime.utcnow(), level=level, message=message)
    db.session.add(entry)
    db.session.commit()
    socketio.emit("paper_activity", entry.to_dict(), room=f"session_{session_id}")
