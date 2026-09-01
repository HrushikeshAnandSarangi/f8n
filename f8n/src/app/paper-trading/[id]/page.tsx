"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr";
import { getSocket } from "@/lib/socket";
import type { ActivityLogEntry, EquityPoint, PaperSession, PaperTrade } from "@/types/agent";

export default function PaperSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const { data: session, mutate } = useSWR<PaperSession>(`/paper-sessions/${sessionId}`, fetcher);

  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (session) {
      setEquityCurve(session.equity_curve || []);
      setTrades(session.trades || []);
      setActivity(session.activity_log || []);
    }
  }, [session]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("join_session", { session_id: Number(sessionId) });

    const onEquity = (point: EquityPoint) => setEquityCurve((prev) => [...prev, point].slice(-500));
    const onTrade = (trade: PaperTrade) => setTrades((prev) => [trade, ...prev].slice(0, 200));
    const onActivity = (entry: ActivityLogEntry) => setActivity((prev) => [entry, ...prev].slice(0, 200));

    socket.on("paper_equity", onEquity);
    socket.on("paper_trade", onTrade);
    socket.on("paper_activity", onActivity);

    return () => {
      socket.emit("leave_session", { session_id: Number(sessionId) });
      socket.off("paper_equity", onEquity);
      socket.off("paper_trade", onTrade);
      socket.off("paper_activity", onActivity);
    };
  }, [sessionId]);

  const stop = async () => {
    setStopping(true);
    try {
      await api.post(`/paper-sessions/${sessionId}/stop`);
      await mutate();
    } finally {
      setStopping(false);
    }
  };

  if (!session) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  const chartData = equityCurve.map((p) => ({ time: new Date(p.timestamp).toLocaleTimeString(), equity: p.equity }));
  const latestEquity = equityCurve[equityCurve.length - 1]?.equity ?? session.starting_capital;
  const pnl = latestEquity - session.starting_capital;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={`Paper Session #${session.id}`}
        description="PAPER / TESTNET only - Binance testnet order legs + simulated fills. No real funds are used."
        actions={
          session.status === "running" ? (
            <Button variant="destructive" onClick={stop} disabled={stopping}>
              {stopping ? "Stopping..." : "Stop Agent"}
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-8xl space-y-6 px-6 tablet:px-10 desktop:px-14">
        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
          <SummaryCard label="Status" value={session.status} />
          <SummaryCard label="Equity" value={`$${latestEquity.toFixed(2)}`} />
          <SummaryCard label="P&L" value={`${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`} accent={pnl >= 0} />
          <SummaryCard label="Starting Capital" value={`$${session.starting_capital.toFixed(2)}`} />
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 font-medium">Live equity</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={false} />
                <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]} />
                <Line type="monotone" dataKey="equity" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting for the first tick...</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 desktop:grid-cols-2">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="font-medium">Trade feed</h2>
            </div>
            <div className="max-h-96 divide-y divide-border overflow-auto">
              {trades.length === 0 && <p className="p-4 text-sm text-muted-foreground">No trades yet.</p>}
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <span
                      className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        trade.side === "buy"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {trade.side.toUpperCase()}
                    </span>
                    {trade.quantity} {trade.symbol} @ ${trade.price.toFixed(2)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {trade.is_testnet_order ? "TESTNET" : "PAPER"} · {trade.exchange}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="font-medium">Activity log</h2>
            </div>
            <div className="max-h-96 divide-y divide-border overflow-auto">
              {activity.length === 0 && <p className="p-4 text-sm text-muted-foreground">No activity yet.</p>}
              {activity.map((entry, index) => (
                <div key={index} className="p-3 text-sm">
                  <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <p className={entry.level === "error" ? "text-red-500" : entry.level === "warn" ? "text-amber-500" : ""}>
                    {entry.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold capitalize ${accent === undefined ? "" : accent ? "text-green-600" : "text-red-500"}`}>
        {value}
      </p>
    </div>
  );
}

