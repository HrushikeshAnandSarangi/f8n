from datetime import datetime

from app.extensions import db


class BacktestRun(db.Model):
    __tablename__ = "backtest_runs"

    id = db.Column(db.Integer, primary_key=True)
    strategy_id = db.Column(db.Integer, db.ForeignKey("strategies.id"), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    starting_capital = db.Column(db.Float, nullable=False, default=10000.0)
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending/running/done/failed
    error = db.Column(db.Text, nullable=True)
    summary_json = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    finished_at = db.Column(db.DateTime, nullable=True)

    trades = db.relationship(
        "BacktestTrade", backref="run", cascade="all, delete-orphan", order_by="BacktestTrade.timestamp"
    )
    equity_points = db.relationship(
        "BacktestEquityPoint",
        backref="run",
        cascade="all, delete-orphan",
        order_by="BacktestEquityPoint.timestamp",
    )

    def to_dict(self, include_details=False):
        data = {
            "id": self.id,
            "strategy_id": self.strategy_id,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "starting_capital": self.starting_capital,
            "status": self.status,
            "error": self.error,
            "summary": self.summary_json,
            "created_at": self.created_at.isoformat(),
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
        }
        if include_details:
            data["trades"] = [t.to_dict() for t in self.trades]
            data["equity_curve"] = [p.to_dict() for p in self.equity_points]
        return data


class BacktestTrade(db.Model):
    __tablename__ = "backtest_trades"

    id = db.Column(db.Integer, primary_key=True)
    run_id = db.Column(db.Integer, db.ForeignKey("backtest_runs.id"), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    symbol = db.Column(db.String(50), nullable=False)
    side = db.Column(db.String(10), nullable=False)  # buy/sell
    exchange = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    fee = db.Column(db.Float, nullable=False, default=0.0)
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
            "pnl": self.pnl,
        }


class BacktestEquityPoint(db.Model):
    __tablename__ = "backtest_equity_points"

    id = db.Column(db.Integer, primary_key=True)
    run_id = db.Column(db.Integer, db.ForeignKey("backtest_runs.id"), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    equity = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {"timestamp": self.timestamp.isoformat(), "equity": self.equity}
