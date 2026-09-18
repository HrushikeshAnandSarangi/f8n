"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useSWR from "swr";
import { CandlestickChart } from "@/components/candlestick-chart";
import { PageHeader } from "@/components/page-header";
import { fetcher } from "@/lib/swr";
import type { BacktestRun, CandleBar } from "@/types/agent";

export default function BacktestDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: run } = useSWR<BacktestRun>(`/backtests/${params.id}`, fetcher, {
    refreshInterval: (data) => (data && (data.status === "pending" || data.status === "running") ? 2000 : 0),
  });
  const { data: candleData } = useSWR<{ candles: Record<string, CandleBar[]> }>(
    run ? `/backtests/${params.id}/candles` : null,
    fetcher,
  );

  const pairs = useMemo(() => Object.keys(candleData?.candles ?? {}), [candleData]);
  const [selectedPair, setSelectedPair] = useState<string>("");
  const activePair = pairs.includes(selectedPair) ? selectedPair : pairs[0];

  if (!run) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  const chartData = (run.equity_curve || []).map((p) => ({
    time: new Date(p.timestamp).toLocaleString(),
    equity: p.equity,
  }));

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={`Backtest #${run.id}`}
        description={`Agent #${run.strategy_id} - ${new Date(run.start_date).toLocaleDateString()} to ${new Date(
          run.end_date,
        ).toLocaleDateString()}`}
      />

      <div className="mx-auto w-full max-w-8xl space-y-6 px-6 tablet:px-10 desktop:px-14">
        {run.status !== "done" && (
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            Status: <span className="font-medium">{run.status}</span>
            {run.error && <p className="mt-2 text-red-500">{run.error}</p>}
          </div>
        )}

        {run.summary && (
          <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
            <SummaryCard label="Total Return" value={`${run.summary.total_return_pct.toFixed(2)}%`} />
            <SummaryCard label="Ending Equity" value={`$${run.summary.ending_equity.toFixed(2)}`} />
            <SummaryCard label="Max Drawdown" value={`${run.summary.max_drawdown_pct.toFixed(2)}%`} />
            <SummaryCard label="Win Rate" value={`${run.summary.win_rate_pct.toFixed(1)}%`} />
            <SummaryCard label="Trades" value={String(run.summary.trade_count)} />
            <SummaryCard label="Total Fees" value={`$${run.summary.total_fees.toFixed(2)}`} />
            <SummaryCard label="Sharpe Ratio" value={run.summary.sharpe_ratio.toFixed(2)} />
            <SummaryCard label="Starting Capital" value={`$${run.summary.starting_capital.toFixed(2)}`} />
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 font-medium">Equity curve</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={false} />
                <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]} />
                <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No equity data yet.</p>
          )}
        </div>

        {pairs.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium">Price chart</h2>
              {pairs.length > 1 && (
                <select
                  value={activePair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                >
                  {pairs.map((pair) => (
                    <option key={pair} value={pair}>
                      {pair}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <CandlestickChart candles={candleData?.candles?.[activePair] ?? []} />
          </div>
        )}

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-medium">Trade log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Side</th>
                  <th className="p-3">Exchange</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(run.trades || []).map((trade) => (
                  <tr key={trade.id}>
                    <td className="p-3 text-xs">{new Date(trade.timestamp).toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          trade.side === "buy"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">{trade.exchange}</td>
                    <td className="p-3">{trade.symbol}</td>
                    <td className="p-3">${trade.price.toFixed(2)}</td>
                    <td className="p-3">{trade.quantity}</td>
                    <td className="p-3">${trade.fee.toFixed(4)}</td>
                    <td className={`p-3 ${trade.pnl && trade.pnl < 0 ? "text-red-500" : "text-green-600"}`}>
                      {trade.pnl !== null ? `$${trade.pnl.toFixed(2)}` : "-"}
                    </td>
                  </tr>
                ))}
                {(run.trades || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                      No trades recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

