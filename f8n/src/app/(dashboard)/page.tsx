"use client";

import { Activity, ArrowRight, History, Plus, Workflow } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr";
import type { BacktestRun, PaperSession, Strategy } from "@/types/agent";

export default function DashboardPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { data: strategies } = useSWR<Strategy[]>("/strategies", fetcher);
  const { data: backtests } = useSWR<BacktestRun[]>("/backtests", fetcher);
  const { data: sessions } = useSWR<PaperSession[]>("/paper-sessions", fetcher, { refreshInterval: 5000 });

  const activeSessions = sessions?.filter((s) => s.status === "running") ?? [];

  const createAgent = async () => {
    setCreating(true);
    try {
      const res = await api.post("/strategies", {
        name: "Untitled Agent",
        graph: { nodes: [], edges: [] },
      });
      router.push(`/strategies/${res.data.id}/builder`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container className="space-y-8 py-8">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build agents from blocks, backtest them against real market data, then paper-trade them live.
          </p>
        </div>
        <Button onClick={createAgent} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" />
          New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <StatCard icon={Workflow} label="Agents" value={strategies?.length ?? "-"} href="/strategies" />
        <StatCard icon={History} label="Backtests" value={backtests?.length ?? "-"} href="/backtest" />
        <StatCard icon={Activity} label="Live Paper Sessions" value={activeSessions.length} href="/paper-trading" />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-medium">Active paper agents</h2>
          <Link href="/paper-trading" className="flex items-center text-sm text-primary hover:underline">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {activeSessions.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Nothing running right now. Deploy an agent from the builder to see it here - PAPER / TESTNET only,
              no real funds are ever used.
            </p>
          )}
          {activeSessions.map((session) => (
            <Link
              key={session.id}
              href={`/paper-trading/${session.id}`}
              className="flex items-center justify-between p-4 hover:bg-accent"
            >
              <div>
                <div className="font-medium">Session #{session.id}</div>
                <div className="text-xs text-muted-foreground">Agent #{session.strategy_id}</div>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                running
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-6 hover:bg-accent"
    >
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <Icon className="h-8 w-8 text-muted-foreground" />
    </Link>
  );
}

