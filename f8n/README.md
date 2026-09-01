# f8n frontend

Next.js app for the f8n agent builder: a React Flow canvas for assembling agents from blocks, plus pages for backtest results and live paper-trading dashboards. See the [root README](../README.md) for the full project overview.

## Setup

```bash
cp .env.example .env.local
npm install --force   # --force: the project intentionally pins a React 19 RC build
npm run dev
```

Environment variables (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
```

Point these at wherever `f8n-Backend` is running.

## Structure

```
src/
├── app/                     # App router pages - no auth, everything is open
│   ├── (dashboard)/         # Overview page (TopNav layout)
│   ├── strategies/          # Agent list + the [id]/builder canvas
│   ├── backtest/            # Backtest launch/history + [id] results
│   └── paper-trading/       # Paper session list + [id] live dashboard
├── components/
│   ├── agent-builder/       # React Flow node, config panel, block palette
│   ├── nav/                 # Side nav / top nav (kept from the original app shell)
│   └── ui/                  # Shared UI primitives
├── lib/api.ts               # Plain axios client (no auth)
├── lib/socket.ts            # Socket.IO client for live paper-trading updates
└── types/agent.ts           # Shared types matching the backend's API shapes
```

## Scripts

- `npm run dev` - start the dev server
- `npm run build` / `npm run start` - production build/serve
- `npm run lint` - ESLint
