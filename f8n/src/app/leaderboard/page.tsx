"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { fetcher } from "@/lib/swr";
import type { LeaderboardRow } from "@/types/agent";

export default function LeaderboardPage() {
  const { data: rows } = useSWR<LeaderboardRow[]>("/leaderboard", fetcher, { refreshInterval: 5000 });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Leaderboard"
        description="Every agent ranked by its best backtest return, with live paper P&L alongside if it's currently running."
      />

      <div className="mx-auto w-full max-w-8xl space-y-6 px-6 tablet:px-10 desktop:px-14">
        <div className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Best return</th>
                  <th className="p-3">Sharpe</th>
                  <th className="p-3">Max drawdown</th>
                  <th className="p-3">Win rate</th>
                  <th className="p-3">Backtests</th>
                  <th className="p-3">Live P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows?.map((row, index) => (
                  <tr key={row.strategy_id} className="hover:bg-accent">
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {index === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-3">
                      <Link href={`/strategies/${row.strategy_id}/builder`} className="font-medium hover:underline">
                        {row.strategy_name}
                      </Link>
                    </td>
                    <td className={`p-3 ${row.best_backtest.total_return_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                      <Link href={`/backtest/${row.best_backtest.id}`} className="hover:underline">
                        {row.best_backtest.total_return_pct >= 0 ? "+" : ""}
                        {row.best_backtest.total_return_pct.toFixed(2)}%
                      </Link>
                    </td>
                    <td className="p-3">{row.best_backtest.sharpe_ratio.toFixed(2)}</td>
                    <td className="p-3">{row.best_backtest.max_drawdown_pct.toFixed(2)}%</td>
                    <td className="p-3">{row.best_backtest.win_rate_pct.toFixed(1)}%</td>
                    <td className="p-3">{row.backtests_run}</td>
                    <td className="p-3">
                      {row.live ? (
                        <Link
                          href={`/paper-trading/${row.live.session_id}`}
                          className={`hover:underline ${row.live.pnl >= 0 ? "text-green-600" : "text-red-500"}`}
                        >
                          {row.live.pnl >= 0 ? "+" : ""}${row.live.pnl.toFixed(2)} ({row.live.pnl_pct.toFixed(2)}%)
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                      No agents have a completed backtest yet - run one to appear on the leaderboard.
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
