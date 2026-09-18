from datetime import datetime, timezone

import pandas as pd

from app.extensions import db
from app.models.market_data import OHLCVCache

from .ccxt_client import get_exchange

_TIMEFRAME_MS = {"1m": 60_000, "5m": 300_000, "15m": 900_000, "1h": 3_600_000}


def fetch_and_cache_ohlcv(exchange_id, symbol, timeframe, start, end):
    """Paginates ccxt's fetch_ohlcv across [start, end] and upserts bars into
    OHLCVCache, so repeat backtests over the same window don't re-hit the exchange."""
    exchange = get_exchange(exchange_id)
    since = int(start.timestamp() * 1000)
    end_ms = int(end.timestamp() * 1000)
    step_ms = _TIMEFRAME_MS.get(timeframe, 60_000)

    existing = {
        row.timestamp
        for row in OHLCVCache.query.filter_by(exchange=exchange_id, symbol=symbol, timeframe=timeframe)
        .filter(OHLCVCache.timestamp >= start, OHLCVCache.timestamp <= end)
        .all()
    }

    while since < end_ms:
        batch = exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=since, limit=1000)
        if not batch:
            break
        for row in batch:
            ts = datetime.fromtimestamp(row[0] / 1000, tz=timezone.utc).replace(tzinfo=None)
            if ts > end or ts in existing:
                continue
            existing.add(ts)
            db.session.add(
                OHLCVCache(
                    exchange=exchange_id,
                    symbol=symbol,
                    timeframe=timeframe,
                    timestamp=ts,
                    open=row[1],
                    high=row[2],
                    low=row[3],
                    close=row[4],
                    volume=row[5],
                )
            )
        last_ts = batch[-1][0]
        if last_ts <= since:
            break
        since = last_ts + step_ms
        if len(batch) < 1000:
            break

    db.session.commit()


def get_ohlcv_frame(exchange, symbol, timeframe, start, end) -> pd.Series:
    """Returns a close-price series (indexed by timestamp) for [start, end], fetching
    and caching from the exchange first."""
    fetch_and_cache_ohlcv(exchange, symbol, timeframe, start, end)

    rows = (
        OHLCVCache.query.filter(
            OHLCVCache.exchange == exchange,
            OHLCVCache.symbol == symbol,
            OHLCVCache.timeframe == timeframe,
            OHLCVCache.timestamp >= start,
            OHLCVCache.timestamp <= end,
        )
        .order_by(OHLCVCache.timestamp)
        .all()
    )
    if not rows:
        return pd.Series(dtype=float)
    return pd.Series([r.close for r in rows], index=[r.timestamp for r in rows])


def get_cached_candles(exchange, symbol, timeframe, start, end):
    """Reads back the OHLC bars a backtest run already cached for its own window -
    used by GET /api/backtests/<id>/candles to chart price without re-hitting the
    exchange. Returns [] if the run hasn't populated the cache yet (still pending)."""
    rows = (
        OHLCVCache.query.filter(
            OHLCVCache.exchange == exchange,
            OHLCVCache.symbol == symbol,
            OHLCVCache.timeframe == timeframe,
            OHLCVCache.timestamp >= start,
            OHLCVCache.timestamp <= end,
        )
        .order_by(OHLCVCache.timestamp)
        .all()
    )
    return [
        {
            "timestamp": r.timestamp.isoformat(),
            "open": r.open,
            "high": r.high,
            "low": r.low,
            "close": r.close,
            "volume": r.volume,
        }
        for r in rows
    ]
