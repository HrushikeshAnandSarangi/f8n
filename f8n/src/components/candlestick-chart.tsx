"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CandleBar } from "@/types/agent";

const UP_COLOR = "#22c55e";
const DOWN_COLOR = "#ef4444";

interface CandleRow {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  range: [number, number];
  isUp: boolean;
}

interface CandlestickChartProps {
  candles: CandleBar[];
  height?: number;
}

/**
 * Recharts has no native OHLC chart, so this draws one Bar per candle with a
 * custom shape: the bar's own [low, high] value gives us the pixel scale for
 * that candle (y = pixel for `high`, y+height = pixel for `low`), which we
 * reuse to place the open/close body inside it - see `renderCandle` below.
 */
export function CandlestickChart({ candles, height = 320 }: CandlestickChartProps) {
  if (candles.length === 0) {
    return <p className="text-sm text-muted-foreground">No price data cached for this run yet.</p>;
  }

  const data: CandleRow[] = candles.map((c) => ({
    time: new Date(c.timestamp).toLocaleString(),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    range: [c.low, c.high],
    isUp: c.close >= c.open,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="time" tick={false} />
        <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} />
        <Tooltip content={<CandleTooltip />} />
        <Bar dataKey="range" isAnimationActive={false} shape={renderCandle} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderCandle(props: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { x, y, width, height, payload } = props as { x: number; y: number; width: number; height: number; payload: CandleRow };
  const { open, high, low, close, isUp } = payload;
  const color = isUp ? UP_COLOR : DOWN_COLOR;

  const valueRange = high - low || 1;
  const pixelFor = (value: number) => y + ((high - value) / valueRange) * height;

  const bodyTop = pixelFor(Math.max(open, close));
  const bodyBottom = pixelFor(Math.min(open, close));
  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

  const centerX = x + width / 2;
  const bodyWidth = Math.max(width * 0.6, 2);
  const bodyX = centerX - bodyWidth / 2;

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={bodyX} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} />
    </g>
  );
}

function CandleTooltip({ active, payload }: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!active || !payload?.length) return null;
  const candle = payload[0].payload as CandleRow;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{candle.time}</p>
      <p>Open: ${candle.open.toFixed(2)}</p>
      <p>High: ${candle.high.toFixed(2)}</p>
      <p>Low: ${candle.low.toFixed(2)}</p>
      <p>Close: ${candle.close.toFixed(2)}</p>
    </div>
  );
}
