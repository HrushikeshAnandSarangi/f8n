export type BlockCategory = "source" | "indicator" | "logic" | "action";

export interface BlockPort {
  name: string;
  label: string;
  data_type: "number" | "boolean" | "object";
}

export interface BlockSpec {
  type: string;
  category: BlockCategory;
  label: string;
  description: string;
  config_schema: {
    type: "object";
    properties: Record<string, { type: string; enum?: string[]; default?: unknown }>;
    required?: string[];
  };
  inputs: BlockPort[];
  outputs: BlockPort[];
  poll_interval_seconds: number | null;
}

export interface GraphNodeData {
  id: string;
  type: string;
  config: Record<string, unknown>;
  // Canvas layout only - the backend stores and round-trips it but never reads it.
  position?: { x: number; y: number };
}

export interface GraphEdgeData {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface StrategyGraph {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

export interface Strategy {
  id: number;
  name: string;
  description: string | null;
  graph?: StrategyGraph;
  created_at: string;
  updated_at: string;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
}

export interface BacktestTrade {
  id: number;
  timestamp: string;
  symbol: string;
  side: "buy" | "sell";
  exchange: string;
  price: number;
  quantity: number;
  fee: number;
  pnl: number | null;
}

export interface BacktestSummary {
  starting_capital: number;
  ending_equity: number;
  total_return_pct: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  trade_count: number;
  total_fees: number;
  sharpe_ratio: number;
}

export interface BacktestRun {
  id: number;
  strategy_id: number;
  start_date: string;
  end_date: string;
  starting_capital: number;
  status: "pending" | "running" | "done" | "failed";
  error: string | null;
  summary: BacktestSummary | null;
  created_at: string;
  finished_at: string | null;
  trades?: BacktestTrade[];
  equity_curve?: EquityPoint[];
}

export interface PaperTrade {
  id: number;
  timestamp: string;
  symbol: string;
  side: "buy" | "sell";
  exchange: string;
  price: number;
  quantity: number;
  fee: number;
  is_testnet_order: boolean;
  order_id: string | null;
  pnl: number | null;
}

export interface ActivityLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "trade";
  message: string;
}

export interface PaperSession {
  id: number;
  strategy_id: number;
  starting_capital: number;
  status: "running" | "stopped" | "error";
  error: string | null;
  created_at: string;
  stopped_at: string | null;
  trades?: PaperTrade[];
  equity_curve?: EquityPoint[];
  activity_log?: ActivityLogEntry[];
}
