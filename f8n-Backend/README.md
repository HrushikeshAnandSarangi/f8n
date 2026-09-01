# f8n backend

Flask API for the f8n agent builder: the block registry, the graph execution engine shared by backtesting and paper trading, and the Binance-testnet paper-trading bot. See the [root README](../README.md) for the full project overview.

**Paper trading only, always.** The only exchange leg that ever places a real order is Binance, and only against the **Binance Testnet** (fake funds, `set_sandbox_mode`). Every other exchange leg is a simulated fill against that exchange's real live price. There is no code path in this service that can place a real-money order.

**No accounts, no auth.** Every endpoint is open - this is a free tool, not a multi-tenant product. Anyone who can reach the API can list, run, and control any agent/backtest/paper session.

## Quick start (Docker Compose)

```bash
cp .env.example .env   # fill in the values below
docker compose up --build
```

This runs Postgres + the API (with migrations applied automatically) on `http://localhost:8000`.

## Quick start (local Python)

```bash
python -m venv .venv
.venv/Scripts/activate   # or `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env     # point DATABASE_URL at a local Postgres, or leave the sqlite default

flask db init && flask db migrate -m "initial" && flask db upgrade
python wsgi.py
```

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Flask signing secret |
| `DATABASE_URL` | Postgres connection string (sqlite is used if unset - fine for local dev, not for production) |
| `CORS_ORIGINS` | Frontend origin(s) allowed to call the API |
| `BINANCE_TESTNET_API_KEY` / `BINANCE_TESTNET_SECRET` | Free keys from [testnet.binance.vision](https://testnet.binance.vision) - required to actually place testnet orders; without them, the paper bot simulates the Binance leg too |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` / `REDDIT_USER_AGENT` | A free "script" app from [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) - enables the Reddit sentiment source; skipped gracefully if unset |
| `CRYPTOPANIC_API_KEY` | A free key from [cryptopanic.com/developers/api](https://cryptopanic.com/developers/api/) - enables the CryptoPanic sentiment source; skipped gracefully if unset |

None of the sentiment env vars are required to run the app: RSS headlines (CoinDesk + Cointelegraph) and Yahoo Finance headlines both work with zero configuration, and each source in the `source.sentiment` block's config can be toggled independently per agent.

## Structure

```
app/
├── blocks/          # Block registry + concrete blocks (sources/indicators/logic/actions)
├── graph/           # GraphEngine (executes one tick of a strategy graph) + execution contexts
├── execution/        # Shared Portfolio (fill/PnL simulation) used by both backtest and paper trading
├── marketdata/        # ccxt exchange adapter + historical OHLCV fetch/cache
├── sentiment_engine/   # VADER + finance lexicon; Reddit/RSS/CryptoPanic/Yahoo sources
├── backtest/            # Replays a graph over historical data
├── papertrading/         # Runs a graph on a live polling loop; manages session threads
├── api/                   # Flask blueprints (blocks, strategies, backtests, paper-sessions - all open, no auth)
├── models/                 # SQLAlchemy models
└── sockets.py               # Socket.IO room join/leave for live session updates
```

## Testing

```bash
pip install -r requirements.txt
pytest
```

The test suite (`tests/`) covers block math, the graph engine, the backtest/portfolio simulation, sentiment scoring, and API smoke tests - all deterministic and network-free. It does not exercise live ccxt/Reddit/Binance/RSS calls; that's covered by manually running a real backtest/paper session as described in the root README.

## Deployment

The `Dockerfile` builds a single platform-agnostic image (gunicorn + eventlet, honors `$PORT`) - it runs as-is on Render, Railway, Fly.io, or any VPS. It is **not** suited to serverless/edge platforms (e.g. Cloudflare Workers): the paper-trading bot is a long-running background thread per session, so it needs a persistent process. Cloudflare (or any CDN) can still sit in front of it.

Background jobs (backtests, paper sessions) run in-process via a thread pool - no Celery/Redis needed for a single instance. If you need to scale the API past one instance, that's the first thing to change.
