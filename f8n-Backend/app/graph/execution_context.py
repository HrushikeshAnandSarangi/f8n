import bisect
import time as time_module
from datetime import datetime


class ExecutionContext:
    """Data access seam between the graph engine and where data actually comes from.
    Historical replay (backtesting) and live polling (paper trading) each implement
    this the same way the strategy graph itself is the same for both.
    """

    def get_price(self, exchange: str, symbol: str):
        raise NotImplementedError

    def get_sentiment(self, ticker: str, sources: dict = None):
        """Returns {"reddit": {"positive", "negative", "neutral"}, "news": {...}}.
        `sources` toggles which data sources feed into it - see sentiment_engine.pipeline."""
        raise NotImplementedError

    def log(self, message: str, level: str = "info"):
        pass


class HistoricalContext(ExecutionContext):
    """Replays cached OHLCV series + any real sentiment snapshots that fall in range.

    price_frames: {(exchange, symbol): pandas.Series} indexed by timestamp.
    sentiment_snapshots: {ticker: [(timestamp, {"reddit": {...}, "news": {...}}), ...]} sorted by time.
    """

    def __init__(self, price_frames, sentiment_snapshots=None):
        self.price_frames = price_frames
        self.sentiment_snapshots = sentiment_snapshots or {}
        self.current_time = None
        self.logs = []
        self._live_sentiment_fallback = {}

    def advance_to(self, ts: datetime):
        self.current_time = ts

    def get_price(self, exchange, symbol):
        series = self.price_frames.get((exchange, symbol))
        if series is None or series.empty:
            return None
        idx = series.index.searchsorted(self.current_time, side="right") - 1
        if idx < 0:
            idx = 0
        return float(series.iloc[idx])

    def get_sentiment(self, ticker, sources=None):
        snapshots = self.sentiment_snapshots.get(ticker)
        if snapshots:
            timestamps = [snap[0] for snap in snapshots]
            idx = bisect.bisect_right(timestamps, self.current_time) - 1
            if idx < 0:
                idx = 0  # no snapshot yet at this point in the window - use the earliest we have
            return snapshots[idx][1]

        # No sentiment history exists for this ticker at all: fetch live once and hold
        # it constant for the whole backtest. This is the documented approximation for
        # backtesting a live-scraped sentiment source.
        cache_key = (ticker, tuple(sorted((sources or {}).items())))
        if cache_key not in self._live_sentiment_fallback:
            from app.sentiment_engine.pipeline import fetch_sentiment

            self._live_sentiment_fallback[cache_key] = fetch_sentiment(ticker, sources=sources)
        return self._live_sentiment_fallback[cache_key]

    def log(self, message, level="info"):
        self.logs.append({"timestamp": self.current_time, "level": level, "message": message})


class LiveContext(ExecutionContext):
    """One instance per poll tick in a running paper-trading session. Prices are
    fetched once per (exchange, symbol) per tick and cached, so every block reading
    the same source in the same tick sees a consistent snapshot. Sentiment is fetched
    on its own longer cadence and cached in-process between ticks.
    """

    _sentiment_cache = {}  # class-level: shared across ticks within a session's bot loop

    def __init__(self, session_id, on_log=None, sentiment_ttl_seconds=600):
        self.session_id = session_id
        self.on_log = on_log
        self.sentiment_ttl_seconds = sentiment_ttl_seconds
        self._price_cache = {}

    def get_price(self, exchange, symbol):
        key = (exchange, symbol)
        if key not in self._price_cache:
            from app.marketdata.ccxt_client import fetch_ticker_price

            self._price_cache[key] = fetch_ticker_price(exchange, symbol)
        return self._price_cache[key]

    def get_sentiment(self, ticker, sources=None):
        cache_key = (ticker, tuple(sorted((sources or {}).items())))
        now = time_module.time()
        cached = self._sentiment_cache.get(cache_key)
        if cached and now - cached[0] < self.sentiment_ttl_seconds:
            return cached[1]

        from app.extensions import db
        from app.models.sentiment import SentimentSnapshot
        from app.sentiment_engine.pipeline import fetch_sentiment

        data = fetch_sentiment(ticker, sources=sources)
        ts = datetime.utcnow()
        for source in ("reddit", "news"):
            breakdown = data.get(source) or {}
            db.session.add(
                SentimentSnapshot(
                    ticker=ticker,
                    timestamp=ts,
                    source=source,
                    positive=breakdown.get("positive", 0.0),
                    negative=breakdown.get("negative", 0.0),
                    neutral=breakdown.get("neutral", 100.0),
                )
            )
        db.session.commit()

        LiveContext._sentiment_cache[cache_key] = (now, data)
        return data

    def log(self, message, level="info"):
        if self.on_log:
            self.on_log(message, level)
