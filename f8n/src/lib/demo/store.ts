import type { ActivityLogEntry, BacktestRun, BacktestTrade, EquityPoint, PaperSession, PaperTrade, Strategy, StrategyGraph } from "@/types/agent";
import { fakeSocket } from "./fake-socket";

const STORAGE_KEY = "f8n_demo_store";
const PAPER_TICK_MS = 3000;
const BACKTEST_POINTS = 60;

interface DemoData {
  nextId: number;
  strategies: Strategy[];
  backtests: BacktestRun[];
  paperSessions: PaperSession[];
}

let data: DemoData | null = null;
const paperTimers = new Map<number, ReturnType<typeof setInterval>>();
const paperRuntime = new Map<number, { cash: number; position: number; avgCost: number; price: number }>();

function nextId(): number {
  const store = ensureLoaded();
  store.nextId += 1;
  persist();
  return store.nextId;
}

function now(): string {
  return new Date().toISOString();
}

function persist() {
  if (typeof window === "undefined" || !data) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureLoaded(): DemoData {
  if (data) return data;

  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        data = JSON.parse(raw) as DemoData;
      } catch {
        data = null;
      }
    }
  }

  if (!data) {
    data = seedData();
    persist();
  }

  // A page reload doesn't survive setInterval state - restart tickers for any
  // session that was left "running" so the demo keeps feeling alive.
  for (const session of data.paperSessions) {
    if (session.status === "running" && !paperTimers.has(session.id)) {
      startPaperTicker(session.id);
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// Seed data - so switching demo mode on shows a fully populated app immediately,
// not an empty shell the user has to build up from scratch.
// ---------------------------------------------------------------------------

function arbitrageGraph(): StrategyGraph {
  return {
    nodes: [
      { id: "n1", type: "source.exchange_ticker", config: { exchange: "binance", symbol: "BTC/USDT" }, position: { x: 60, y: 60 } },
      { id: "n2", type: "source.exchange_ticker", config: { exchange: "kraken", symbol: "BTC/USDT" }, position: { x: 60, y: 240 } },
      { id: "n3", type: "indicator.spread_pct", config: {}, position: { x: 340, y: 150 } },
      { id: "n4", type: "logic.threshold", config: { operator: ">=", threshold: 0.5 }, position: { x: 600, y: 150 } },
      { id: "n5", type: "action.paper_buy", config: { exchange: "binance", symbol: "BTC/USDT", quantity: 0.01, fee_pct: 0.001 }, position: { x: 860, y: 150 } },
    ],
    edges: [
      { source: "n1", sourceHandle: "price", target: "n3", targetHandle: "price_a" },
      { source: "n2", sourceHandle: "price", target: "n3", targetHandle: "price_b" },
      { source: "n3", sourceHandle: "spread_pct", target: "n4", targetHandle: "value" },
      { source: "n4", sourceHandle: "triggered", target: "n5", targetHandle: "trigger" },
    ],
  };
}

function sentimentGraph(): StrategyGraph {
  return {
    nodes: [
      { id: "n1", type: "source.sentiment", config: { ticker: "BTC-USD", use_reddit: true, use_rss_news: true, use_cryptopanic: false, use_yahoo_finance: false }, position: { x: 60, y: 120 } },
      { id: "n2", type: "indicator.sentiment_score", config: {}, position: { x: 380, y: 120 } },
      { id: "n3", type: "logic.threshold", config: { operator: ">=", threshold: 20 }, position: { x: 640, y: 120 } },
      { id: "n4", type: "action.paper_buy", config: { exchange: "binance", symbol: "BTC/USDT", quantity: 0.01, fee_pct: 0.001 }, position: { x: 900, y: 120 } },
    ],
    edges: [
      { source: "n1", sourceHandle: "reddit", target: "n2", targetHandle: "sentiment" },
      { source: "n2", sourceHandle: "score", target: "n3", targetHandle: "value" },
      { source: "n3", sourceHandle: "triggered", target: "n4", targetHandle: "trigger" },
    ],
  };
}

function seedData(): DemoData {
  const store: DemoData = { nextId: 0, strategies: [], backtests: [], paperSessions: [] };
  data = store;

  const arbStrategy = createStrategy({
    name: "Demo: BTC Binance <-> Kraken Arbitrage",
    description: "Buys on Binance whenever it trades at least 0.5% below Kraken.",
    graph: arbitrageGraph(),
  });

  createStrategy({
    name: "Demo: BTC Sentiment Agent",
    description: "Buys when combined Reddit + RSS sentiment turns strongly positive.",
    graph: sentimentGraph(),
  });

  const finishedRun = createBacktest({
    strategy_id: arbStrategy.id,
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: now(),
    starting_capital: 10000,
  });
  completeBacktest(finishedRun.id);

  const session = createPaperSession({ strategy_id: arbStrategy.id, starting_capital: 10000 });
  seedSessionHistory(session.id);

  return store;
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

export function listStrategies(): Strategy[] {
  return [...ensureLoaded().strategies].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getStrategy(id: number): Strategy | undefined {
  return ensureLoaded().strategies.find((s) => s.id === id);
}

export function createStrategy(input: { name?: string; description?: string | null; graph?: StrategyGraph }): Strategy {
  const store = ensureLoaded();
  const timestamp = now();
  const strategy: Strategy = {
    id: nextId(),
    name: input.name || "Untitled Agent",
    description: input.description ?? null,
    graph: input.graph || { nodes: [], edges: [] },
    created_at: timestamp,
    updated_at: timestamp,
  };
  store.strategies.push(strategy);
  persist();
  return strategy;
}

export function updateStrategy(id: number, input: { name?: string; description?: string | null; graph?: StrategyGraph }): Strategy | undefined {
  const strategy = getStrategy(id);
  if (!strategy) return undefined;
  if (input.name !== undefined) strategy.name = input.name;
  if (input.description !== undefined) strategy.description = input.description;
  if (input.graph !== undefined) strategy.graph = input.graph;
  strategy.updated_at = now();
  persist();
  return strategy;
}

export function deleteStrategy(id: number): boolean {
  const store = ensureLoaded();
  const index = store.strategies.findIndex((s) => s.id === id);
  if (index === -1) return false;
  store.strategies.splice(index, 1);
  persist();
  return true;
}

// ---------------------------------------------------------------------------
// Backtests
// ---------------------------------------------------------------------------

export function listBacktests(): BacktestRun[] {
  return [...ensureLoaded().backtests].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getBacktest(id: number): BacktestRun | undefined {
  return ensureLoaded().backtests.find((b) => b.id === id);
}

export function createBacktest(input: { strategy_id: number; start_date: string; end_date: string; starting_capital?: number }): BacktestRun {
  const store = ensureLoaded();
  const run: BacktestRun = {
    id: nextId(),
    strategy_id: input.strategy_id,
    start_date: input.start_date,
    end_date: input.end_date,
    starting_capital: input.starting_capital ?? 10000,
    status: "pending",
    error: null,
    summary: null,
    created_at: now(),
    finished_at: null,
  };
  store.backtests.push(run);
  persist();

  setTimeout(() => {
    run.status = "running";
    persist();
    setTimeout(() => completeBacktest(run.id), 1800);
  }, 600);

  return run;
}

function completeBacktest(id: number) {
  const run = getBacktest(id);
  if (!run) return;

  const { equityCurve, trades } = generateSyntheticSeries(run.start_date, run.end_date, run.starting_capital);
  run.equity_curve = equityCurve;
  run.trades = trades;
  run.summary = summarize(run.starting_capital, equityCurve, trades);
  run.status = "done";
  run.finished_at = now();
  persist();
}

function generateSyntheticSeries(startIso: string, endIso: string, startingCapital: number) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const span = Math.max(end - start, 60_000);
  const stepMs = span / BACKTEST_POINTS;

  const equityCurve: EquityPoint[] = [];
  const trades: BacktestTrade[] = [];
  let equity = startingCapital;
  let price = 62000 + Math.random() * 8000;

  for (let i = 0; i <= BACKTEST_POINTS; i++) {
    const timestamp = new Date(start + i * stepMs).toISOString();
    price = Math.max(1000, price * (1 + (Math.random() - 0.47) * 0.01));

    if (i > 0 && Math.random() < 0.3) {
      const side: "buy" | "sell" = Math.random() < 0.65 ? "buy" : "sell";
      const quantity = Number((0.005 + Math.random() * 0.02).toFixed(4));
      const fee = Number((price * quantity * 0.001).toFixed(4));
      const pnl = side === "sell" ? Number(((Math.random() - 0.3) * 40).toFixed(2)) : null;
      const delta = side === "buy" ? -(price * quantity + fee) : price * quantity - fee + (pnl ?? 0);
      equity += delta;

      trades.push({
        id: nextId(),
        timestamp,
        symbol: "BTC/USDT",
        side,
        exchange: Math.random() < 0.5 ? "binance" : "kraken",
        price: Number(price.toFixed(2)),
        quantity,
        fee,
        pnl,
      });
    }

    equityCurve.push({ timestamp, equity: Number(equity.toFixed(2)) });
  }

  return { equityCurve, trades };
}

function summarize(startingCapital: number, equityCurve: EquityPoint[], trades: BacktestTrade[]) {
  const endingEquity = equityCurve[equityCurve.length - 1]?.equity ?? startingCapital;
  const totalReturnPct = ((endingEquity - startingCapital) / startingCapital) * 100;

  let peak = startingCapital;
  let maxDrawdownPct = 0;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);
    if (peak) maxDrawdownPct = Math.max(maxDrawdownPct, ((peak - point.equity) / peak) * 100);
  }

  const closedTrades = trades.filter((t) => t.pnl !== null);
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const winRatePct = closedTrades.length ? (wins.length / closedTrades.length) * 100 : 0;

  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    if (prev) returns.push((equityCurve[i].equity - prev) / prev);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length || 1);
  const sharpe = variance ? (mean / Math.sqrt(variance)) * Math.sqrt(returns.length) : 0;

  return {
    starting_capital: startingCapital,
    ending_equity: endingEquity,
    total_return_pct: Number(totalReturnPct.toFixed(4)),
    max_drawdown_pct: Number(maxDrawdownPct.toFixed(4)),
    win_rate_pct: Number(winRatePct.toFixed(2)),
    trade_count: trades.length,
    total_fees: Number(trades.reduce((sum, t) => sum + t.fee, 0).toFixed(4)),
    sharpe_ratio: Number(sharpe.toFixed(4)),
  };
}

// ---------------------------------------------------------------------------
// Paper sessions
// ---------------------------------------------------------------------------

export function listPaperSessions(): PaperSession[] {
  return [...ensureLoaded().paperSessions].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getPaperSession(id: number): PaperSession | undefined {
  return ensureLoaded().paperSessions.find((s) => s.id === id);
}

export function createPaperSession(input: { strategy_id: number; starting_capital?: number }): PaperSession {
  const store = ensureLoaded();
  const startingCapital = input.starting_capital ?? 10000;
  const session: PaperSession = {
    id: nextId(),
    strategy_id: input.strategy_id,
    starting_capital: startingCapital,
    status: "running",
    error: null,
    created_at: now(),
    stopped_at: null,
    trades: [],
    equity_curve: [{ timestamp: now(), equity: startingCapital }],
    activity_log: [{ timestamp: now(), level: "info", message: "Demo paper session started" }],
  };
  store.paperSessions.push(session);
  persist();
  startPaperTicker(session.id);
  return session;
}

export function stopPaperSession(id: number): PaperSession | undefined {
  const session = getPaperSession(id);
  if (!session) return undefined;
  stopPaperTicker(id);
  session.status = "stopped";
  session.stopped_at = now();
  session.activity_log = [{ timestamp: now(), level: "info", message: "Session stopped" }, ...(session.activity_log || [])];
  persist();
  return session;
}

function seedSessionHistory(id: number) {
  // Give the seeded session a little history immediately, rather than starting
  // from a flat line, so /paper-trading looks alive the instant demo mode is on.
  for (let i = 0; i < 6; i++) {
    tickPaperSession(id);
  }
}

function startPaperTicker(id: number) {
  stopPaperTicker(id);
  const timer = setInterval(() => tickPaperSession(id), PAPER_TICK_MS);
  paperTimers.set(id, timer);
}

function stopPaperTicker(id: number) {
  const timer = paperTimers.get(id);
  if (timer) clearInterval(timer);
  paperTimers.delete(id);
}

export function stopAllTickers() {
  for (const id of paperTimers.keys()) stopPaperTicker(id);
}

export function resetDemoData() {
  stopAllTickers();
  paperRuntime.clear();
  data = null;
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  ensureLoaded();
}

function tickPaperSession(id: number) {
  const session = getPaperSession(id);
  if (!session || session.status !== "running") {
    stopPaperTicker(id);
    return;
  }

  if (!paperRuntime.has(id)) {
    paperRuntime.set(id, { cash: session.starting_capital, position: 0, avgCost: 0, price: 62000 + Math.random() * 8000 });
  }
  const runtime = paperRuntime.get(id)!;
  runtime.price = Math.max(1000, runtime.price * (1 + (Math.random() - 0.47) * 0.008));

  // Mirrors app/execution/portfolio.py: equity is cash + position marked to the
  // current price, not a running cash-flow tally - an earlier version of this
  // tracked cash flow only, so a buy-heavy run looked like it was crashing even
  // though the BTC it was holding had real value.
  let trade: PaperTrade | null = null;
  if (Math.random() < 0.3) {
    const quantity = Number((0.001 + Math.random() * 0.01).toFixed(4));
    const exchange = Math.random() < 0.6 ? "binance" : "kraken";
    const fee = Number((runtime.price * quantity * 0.001).toFixed(4));
    const canAffordFull = runtime.cash >= runtime.price * quantity + fee;
    const wantsToSell = runtime.position > 0 && Math.random() < 0.4;
    const side: "buy" | "sell" = wantsToSell || !canAffordFull ? "sell" : "buy";

    if (side === "buy" && canAffordFull) {
      const cost = runtime.price * quantity;
      runtime.avgCost = runtime.position ? (runtime.avgCost * runtime.position + cost) / (runtime.position + quantity) : runtime.price;
      runtime.position += quantity;
      runtime.cash -= cost + fee;

      trade = {
        id: nextId(),
        timestamp: now(),
        symbol: "BTC/USDT",
        side,
        exchange,
        price: Number(runtime.price.toFixed(2)),
        quantity,
        fee,
        is_testnet_order: exchange === "binance",
        order_id: exchange === "binance" ? `demo-${Math.random().toString(36).slice(2, 10)}` : null,
        pnl: null,
      };
    } else if (side === "sell" && runtime.position > 0) {
      const sellQty = Math.min(quantity, runtime.position);
      const pnl = Number(((runtime.price - runtime.avgCost) * sellQty - fee).toFixed(2));
      runtime.position -= sellQty;
      runtime.cash += runtime.price * sellQty - fee;

      trade = {
        id: nextId(),
        timestamp: now(),
        symbol: "BTC/USDT",
        side,
        exchange,
        price: Number(runtime.price.toFixed(2)),
        quantity: sellQty,
        fee,
        is_testnet_order: exchange === "binance",
        order_id: exchange === "binance" ? `demo-${Math.random().toString(36).slice(2, 10)}` : null,
        pnl,
      };
    }
    // Neither affordable nor sellable this tick (e.g. cash and position both
    // near zero) - just skip; the equity point below still records the mark.
  }

  const equity = runtime.cash + runtime.position * runtime.price;
  const equityPoint: EquityPoint = { timestamp: now(), equity: Number(equity.toFixed(2)) };
  session.equity_curve = [...(session.equity_curve || []), equityPoint].slice(-500);
  fakeSocket.dispatch("paper_equity", equityPoint);

  if (trade) {
    session.trades = [trade, ...(session.trades || [])].slice(0, 200);
    fakeSocket.dispatch("paper_trade", trade);

    const tag = trade.is_testnet_order ? "TESTNET" : "PAPER";
    const entry: ActivityLogEntry = {
      timestamp: now(),
      level: "trade",
      message: `${tag} ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} @ ${trade.price} on ${trade.exchange}`,
    };
    session.activity_log = [entry, ...(session.activity_log || [])].slice(0, 200);
    fakeSocket.dispatch("paper_activity", entry);
  }

  persist();
}
