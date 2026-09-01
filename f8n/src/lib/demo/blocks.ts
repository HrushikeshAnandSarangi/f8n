import type { BlockSpec } from "@/types/agent";

const SUPPORTED_EXCHANGES = ["binance", "kraken", "coinbase", "kucoin", "bybit"];
const OPERATORS = [">", ">=", "<", "<="];

/**
 * Mirrors the real backend's block registry (f8n-Backend/app/blocks/*.py) field-for-
 * field, so the builder canvas, config panel, and palette behave identically whether
 * they're driven by GET /api/blocks or this demo copy. Keep these two in sync.
 */
export const DEMO_BLOCKS: BlockSpec[] = [
  {
    type: "source.exchange_ticker",
    category: "source",
    label: "Exchange Price",
    description: "Live/historical last-traded price for a symbol on one exchange.",
    config_schema: {
      type: "object",
      properties: {
        exchange: { type: "string", enum: SUPPORTED_EXCHANGES, default: "binance" },
        symbol: { type: "string", default: "BTC/USDT" },
      },
      required: ["exchange", "symbol"],
    },
    inputs: [],
    outputs: [{ name: "price", label: "Price", data_type: "number" }],
    poll_interval_seconds: 5,
  },
  {
    type: "source.sentiment",
    category: "source",
    label: "Sentiment Score",
    description: "Reddit + news sentiment breakdown for a ticker, from independently configurable free sources.",
    config_schema: {
      type: "object",
      properties: {
        ticker: { type: "string", default: "BTC-USD" },
        use_reddit: { type: "boolean", default: true },
        use_rss_news: { type: "boolean", default: true },
        use_cryptopanic: { type: "boolean", default: false },
        use_yahoo_finance: { type: "boolean", default: false },
      },
      required: ["ticker"],
    },
    inputs: [],
    outputs: [
      { name: "reddit", label: "Reddit %", data_type: "object" },
      { name: "news", label: "News %", data_type: "object" },
    ],
    poll_interval_seconds: 600,
  },
  {
    type: "indicator.spread_pct",
    category: "indicator",
    label: "Spread %",
    description: "Percentage difference between two prices: (price_b - price_a) / price_a * 100.",
    config_schema: { type: "object", properties: {} },
    inputs: [
      { name: "price_a", label: "Price A", data_type: "number" },
      { name: "price_b", label: "Price B", data_type: "number" },
    ],
    outputs: [{ name: "spread_pct", label: "Spread %", data_type: "number" }],
    poll_interval_seconds: null,
  },
  {
    type: "indicator.sentiment_score",
    category: "indicator",
    label: "Sentiment Score",
    description: "Reduces a positive/negative/neutral breakdown to one scalar (positive - negative).",
    config_schema: { type: "object", properties: {} },
    inputs: [{ name: "sentiment", label: "Sentiment %", data_type: "object" }],
    outputs: [{ name: "score", label: "Score", data_type: "number" }],
    poll_interval_seconds: null,
  },
  {
    type: "logic.threshold",
    category: "logic",
    label: "Threshold",
    description: "Compares an input value against a configured operator/threshold.",
    config_schema: {
      type: "object",
      properties: {
        operator: { type: "string", enum: OPERATORS, default: ">=" },
        threshold: { type: "number", default: 0.5 },
      },
      required: ["operator", "threshold"],
    },
    inputs: [{ name: "value", label: "Value", data_type: "number" }],
    outputs: [{ name: "triggered", label: "Triggered", data_type: "boolean" }],
    poll_interval_seconds: null,
  },
  {
    type: "logic.and",
    category: "logic",
    label: "AND",
    description: "AND of two boolean inputs.",
    config_schema: { type: "object", properties: {} },
    inputs: [
      { name: "a", label: "A", data_type: "boolean" },
      { name: "b", label: "B", data_type: "boolean" },
    ],
    outputs: [{ name: "result", label: "Result", data_type: "boolean" }],
    poll_interval_seconds: null,
  },
  {
    type: "logic.or",
    category: "logic",
    label: "OR",
    description: "OR of two boolean inputs.",
    config_schema: { type: "object", properties: {} },
    inputs: [
      { name: "a", label: "A", data_type: "boolean" },
      { name: "b", label: "B", data_type: "boolean" },
    ],
    outputs: [{ name: "result", label: "Result", data_type: "boolean" }],
    poll_interval_seconds: null,
  },
  {
    type: "action.paper_buy",
    category: "action",
    label: "Paper Buy",
    description: "Places a paper buy order when triggered.",
    config_schema: {
      type: "object",
      properties: {
        exchange: { type: "string", default: "binance" },
        symbol: { type: "string", default: "BTC/USDT" },
        quantity: { type: "number", default: 0.001 },
        fee_pct: { type: "number", default: 0.001 },
      },
      required: ["exchange", "symbol", "quantity"],
    },
    inputs: [{ name: "trigger", label: "Trigger", data_type: "boolean" }],
    outputs: [{ name: "triggered", label: "Triggered", data_type: "boolean" }],
    poll_interval_seconds: null,
  },
  {
    type: "action.paper_sell",
    category: "action",
    label: "Paper Sell",
    description: "Places a paper sell order when triggered.",
    config_schema: {
      type: "object",
      properties: {
        exchange: { type: "string", default: "binance" },
        symbol: { type: "string", default: "BTC/USDT" },
        quantity: { type: "number", default: 0.001 },
        fee_pct: { type: "number", default: 0.001 },
      },
      required: ["exchange", "symbol", "quantity"],
    },
    inputs: [{ name: "trigger", label: "Trigger", data_type: "boolean" }],
    outputs: [{ name: "triggered", label: "Triggered", data_type: "boolean" }],
    poll_interval_seconds: null,
  },
  {
    type: "action.log",
    category: "action",
    label: "Log",
    description: "Records a note on the run's activity feed.",
    config_schema: { type: "object", properties: { label: { type: "string", default: "note" } } },
    inputs: [{ name: "message", label: "Message", data_type: "object" }],
    outputs: [],
    poll_interval_seconds: null,
  },
];

export function blockSpecFor(type: string): BlockSpec | undefined {
  return DEMO_BLOCKS.find((b) => b.type === type);
}
