"use client";

import { Switch } from "@headlessui/react";
import { Activity, ArrowRight, History, Plus, RotateCcw, Sparkles, Workflow } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { api } from "@/lib/api";
import { useDemoMode } from "@/lib/demo/mode";
import { fetcher } from "@/lib/swr";
import type { BacktestRun, PaperSession, Strategy } from "@/types/agent";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [demoMode, setDemoMode] = useDemoMode();
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

  const resetDemoData = async () => {
    const { resetDemoData: reset } = await import("@/lib/demo/store");
    reset();
    window.location.reload();
  };

  return (
    <Container className="space-y-8 py-8">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <InfoTooltip text="Build agents from blocks, backtest them against real market data, then paper-trade them live." />
        </div>
        <Button onClick={createAgent} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" />
          New Agent
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Demo Mode</p>
            <p className="text-sm text-muted-foreground">
              Explore the whole app with realistic simulated agents, backtests, and a live paper session -
              no backend connection required. Nothing here touches real data.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {demoMode && (
            <button
              onClick={resetDemoData}
              className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              title="Clear and reseed demo data"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Reset demo data
            </button>
          )}
          <Switch
            checked={demoMode}
            onChange={setDemoMode}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              demoMode ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700",
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                demoMode ? "translate-x-6" : "translate-x-1",
              )}
            />
          </Switch>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <StatCard
          icon={Workflow}
          label="Agents"
          value={strategies?.length ?? "-"}
          href="/strategies"
          help="A graph of blocks you assemble on the canvas - the same graph is used to backtest and to paper-trade."
        />
        <StatCard
          icon={History}
          label="Backtests"
          value={backtests?.length ?? "-"}
          href="/backtest"
          help="A replay of an agent's graph against real historical market data, before risking any (paper) money on it."
        />
        <StatCard
          icon={Activity}
          label="Live Paper Sessions"
          value={activeSessions.length}
          href="/paper-trading"
          help="An agent running live right now - PAPER / TESTNET only, no real funds are ever used."
        />
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
  help,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  href: string;
  help: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-6 hover:bg-accent"
    >
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <InfoTooltip text={help} />
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <Icon className="h-8 w-8 text-muted-foreground" />
    </Link>
  );
}

