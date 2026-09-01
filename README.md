# f8n: Visual Crypto Arbitrage Agent Builder 🤖📈

<p align="center">
  <img src="https://f8n.vercel.app/f8n.svg" alt="f8n Logo" width="100"/>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Frontend-Next.js-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Flask-000000?style=flat&logo=flask)](https://flask.palletsprojects.com/)

---

## ⭐️ Overview

**f8n** lets you build a crypto trading agent **visually**, from pre-configured blocks on an n8n-style canvas, **backtest** it against real historical market data, and **deploy it as a paper-trading agent** to see it run live - all without ever touching real funds.

An agent is a graph of blocks you wire together:

```
[Binance BTC/USDT] ─┐
                     ├─▶ [Spread %] ─▶ [Threshold] ─▶ [Paper Buy]
[Kraken BTC/USDT]  ──┘
```

The exact same graph is replayed against historical data for backtesting and polled live for paper trading, so what you test is what actually runs.

---

## ✨ What you can build

- **Cross-exchange arbitrage agents** - compare a symbol's price across two exchanges (via [ccxt](https://github.com/ccxt/ccxt)) and trade the spread.
- **Sentiment agents** - trade on a financial-tuned NLP sentiment score pulled from Reddit + Yahoo Finance news.
- Mix and match: every block (price sources, sentiment, spread math, thresholds, AND/OR logic, buy/sell actions) is a pluggable, reusable node - the block registry (`GET /api/blocks`) is the single source of truth the canvas renders itself from, so new block types show up automatically.

**Paper trading only, always.** Binance orders go through the **Binance Testnet** (fake funds); any other exchange leg is simulated against that exchange's live public price. No code path in this project can place a real-money order.

**No accounts, no login.** This is a free tool - open it and start building; every agent, backtest, and paper session is visible to anyone who has the link.

---

## 🛠 Tech Stack

| | |
|---|---|
| **Frontend** | [Next.js](https://nextjs.org/) (React), [React Flow](https://reactflow.dev/) for the agent canvas, Tailwind CSS, Recharts |
| **Backend** | [Flask](https://flask.palletsprojects.com/), SQLAlchemy + Postgres, Flask-SocketIO (live updates), [ccxt](https://github.com/ccxt/ccxt) |
| **Sentiment** | Reddit (praw) + Yahoo Finance news (newspaper3k), HuggingFace financial-sentiment model |
| **Deployment** | Frontend on [Vercel](https://vercel.com/); backend as a plain Docker container (Render/Railway/Fly/any VPS) |

---

## ⚙️ Getting Started

This is a two-part project: `f8n/` (Next.js frontend) and `f8n-Backend/` (Flask backend). See each directory's README for details.

### Fastest path (Docker Compose, backend)

```bash
cd f8n-Backend
cp .env.example .env   # fill in Binance testnet + Reddit API keys (both free)
docker compose up --build
```

This starts Postgres + the Flask API on `http://localhost:8000`.

### Frontend

```bash
cd f8n
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL / NEXT_PUBLIC_SOCKET_URL at the backend
npm install --force
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and build your first agent - no sign-up required.

---

## 📊 Pages

| Page | Description |
|------|-------------|
| **Dashboard** (`/`) | Overview of your agents and active paper sessions. |
| **Agents** (`/strategies`) | List and create agents; opens the block-based builder. |
| **Builder** (`/strategies/[id]/builder`) | The canvas: drag blocks from the palette, wire them up, save, backtest, or deploy. |
| **Backtests** (`/backtest`) | Launch a backtest and browse history; each run shows an equity curve, summary metrics, and trade log. |
| **Paper Trading** (`/paper-trading`) | Live agents: real-time equity curve, trade feed, and activity log over WebSocket. |

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/NewBlock`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
