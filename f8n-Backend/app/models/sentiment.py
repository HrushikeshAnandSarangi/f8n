from app.extensions import db


class SentimentSnapshot(db.Model):
    """A point-in-time sentiment reading, written every time the sentiment source block
    actually scrapes Reddit/news (live, in a paper session, or an on-demand check).

    There is no historical sentiment dataset to backtest against, so these snapshots
    are what backtests fall back on for a `source.sentiment` block: the nearest snapshot
    is held flat across gaps. Backtests get more accurate the longer paper agents have
    been running and accumulating real snapshots.
    """

    __tablename__ = "sentiment_snapshots"

    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    source = db.Column(db.String(20), nullable=False)  # reddit | news
    positive = db.Column(db.Float, nullable=False)
    negative = db.Column(db.Float, nullable=False)
    neutral = db.Column(db.Float, nullable=False)

    __table_args__ = (db.Index("ix_sentiment_lookup", "ticker", "source", "timestamp"),)
