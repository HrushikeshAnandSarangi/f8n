"""The pluggable exchange adapter. Every exchange `source.exchange_ticker` can point at
goes through here - adding a new one is adding its id to SUPPORTED_EXCHANGES, not a
rewrite of any strategy/graph/engine code.
"""

SUPPORTED_EXCHANGES = ["binance", "kraken", "coinbase", "kucoin", "bybit"]

_exchange_cache = {}


def get_exchange(exchange_id: str):
    if exchange_id not in SUPPORTED_EXCHANGES:
        raise ValueError(f"Unsupported exchange: {exchange_id}")
    if exchange_id not in _exchange_cache:
        import ccxt

        exchange_class = getattr(ccxt, exchange_id)
        _exchange_cache[exchange_id] = exchange_class({"enableRateLimit": True})
    return _exchange_cache[exchange_id]


def fetch_ticker_price(exchange_id: str, symbol: str) -> float:
    exchange = get_exchange(exchange_id)
    ticker = exchange.fetch_ticker(symbol)
    return float(ticker["last"])
