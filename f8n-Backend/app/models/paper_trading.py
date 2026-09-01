from datetime import datetime

from app.extensions import db


class PaperSession(db.Model):
    __tablename__ = "paper_sessions"

    id = db.Column(db.Integer, primary_key=True)
    strategy_id = db.Column(db.Integer, db.ForeignKey("strategies.id"), nullable=False)
    graph_json = db.Column(db.JSON, nullable=False)  # snapshot of the strategy graph at deploy time
    starting_capital = db.Column(db.Float, nullable=False, default=10000.0)
    status = db.Column(db.String(20), nullable=False, default="running")  # running/stopped/error
    error = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    stopped_at = db.Column(db.DateTime, nullable=True)

    trades = db.relationship(
        "PaperTrade", backref="session", cascade="all, delete-orphan", order_by="PaperTrade.timestamp"
    )
    equity_points = db.relationship(
        "PaperEquityPoint", backref="session", cascade="all, delete-orphan", order_by="PaperEquityPoint.timestamp"
    )
    activity_log = db.relationship(
        "ActivityLogEntry", backref="session", cascade="all, delete-orphan", order_by="ActivityLogEntry.timestamp"
    )

    def to_dict(self, include_details=False):
        data = {
            "id": self.id,
            "strategy_id": self.strategy_id,
            "starting_capital": self.starting_capital,
            "status": self.status,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "stopped_at": self.stopped_at.isoformat() if self.stopped_at else None,
        }
        if include_details:
            data["trades"] = [t.to_dict() for t in self.trades]
            data["equity_curve"] = [p.to_dict() for p in self.equity_points]
            data["activity_log"] = [a.to_dict() for a in self.activity_log]
        return data


class PaperTrade(db.Model):
    __tablename__ = "paper_trades"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("paper_sessions.id"), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    symbol = db.Column(db.String(50), nullable=False)
    side = db.Column(db.String(10), nullable=False)
    exchange = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    fee = db.Column(db.Float, nullable=False, default=0.0)
    is_testnet_order = db.Column(db.Boolean, nullable=False, default=False)
    order_id = db.Column(db.String(100), nullable=True)
    pnl = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "symbol": self.symbol,
            "side": self.side,
            "exchange": self.exchange,
            "price": self.price,
            "quantity": self.quantity,
            "fee": self.fee,
            "is_testnet_order": self.is_testnet_order,
            "order_id": self.order_id,
            "pnl": self.pnl,
        }


class PaperEquityPoint(db.Model):
    __tablename__ = "paper_equity_points"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("paper_sessions.id"), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    equity = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {"timestamp": self.timestamp.isoformat(), "equity": self.equity}


class ActivityLogEntry(db.Model):
    __tablename__ = "activity_log_entries"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("paper_sessions.id"), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    level = db.Column(db.String(10), nullable=False, default="info")  # info/warn/error/trade
    message = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {"timestamp": self.timestamp.isoformat(), "level": self.level, "message": self.message}
