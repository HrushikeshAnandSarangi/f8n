"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr";
import type { BacktestRun, Strategy } from "@/types/agent";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function BacktestListPage() {
  const router = useRouter();
  const { data: runs, mutate } = useSWR<BacktestRun[]>("/backtests", fetcher, { refreshInterval: 5000 });
  const { data: strategies } = useSWR<Strategy[]>("/strategies", fetcher);

  const [strategyId, setStrategyId] = useState<string>("");
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(weekAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [startingCapital, setStartingCapital] = useState(10000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const launch = async () => {
    if (!strategyId) {
      setError("Pick an agent first");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/backtests", {
        strategy_id: Number(strategyId),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        starting_capital: startingCapital,
      });
      await mutate();
      router.push(`/backtest/${res.data.id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not start backtest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Backtests"
        description="Replay an agent against real historical market data before risking any (paper) money on it."
      />

      <div className="mx-auto w-full max-w-8xl space-y-6 px-6 tablet:px-10 desktop:px-14">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-medium">Launch a backtest</h2>
          <div className="grid grid-cols-1 gap-3 tablet:grid-cols-4">
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="">Select an agent...</option>
              {strategies?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              value={startingCapital}
              onChange={(e) => setStartingCapital(Number(e.target.value))}
              placeholder="Starting capital"
              className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <Button onClick={launch} disabled={submitting} className="mt-3">
            {submitting ? "Starting..." : "Run backtest"}
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-medium">History</h2>
          </div>
          <div className="divide-y divide-border">
            {runs?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No backtests yet.</p>}
            {runs?.map((run) => (
              <Link key={run.id} href={`/backtest/${run.id}`} className="flex items-center justify-between p-4 hover:bg-accent">
                <div>
                  <div className="font-medium">Run #{run.id} - Agent #{run.strategy_id}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(run.start_date).toLocaleDateString()} - {new Date(run.end_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {run.summary && (
                    <span
                      className={run.summary.total_return_pct >= 0 ? "text-sm text-green-600" : "text-sm text-red-600"}
                    >
                      {run.summary.total_return_pct >= 0 ? "+" : ""}
                      {run.summary.total_return_pct.toFixed(2)}%
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[run.status]}`}>
                    {run.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

