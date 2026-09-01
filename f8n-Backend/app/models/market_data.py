from app.extensions import db


class OHLCVCache(db.Model):
    __tablename__ = "ohlcv_cache"

    id = db.Column(db.Integer, primary_key=True)
    exchange = db.Column(db.String(50), nullable=False)
    symbol = db.Column(db.String(50), nullable=False)
    timeframe = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    open = db.Column(db.Float, nullable=False)
    high = db.Column(db.Float, nullable=False)
    low = db.Column(db.Float, nullable=False)
    close = db.Column(db.Float, nullable=False)
    volume = db.Column(db.Float, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("exchange", "symbol", "timeframe", "timestamp", name="uq_ohlcv_bar"),
        db.Index("ix_ohlcv_lookup", "exchange", "symbol", "timeframe", "timestamp"),
    )
