"use client";

import { Plus, Workflow } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr";
import type { Strategy } from "@/types/agent";

export default function StrategiesPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { data: strategies, isLoading } = useSWR<Strategy[]>("/strategies", fetcher);

  const createAgent = async () => {
    setCreating(true);
    try {
      const res = await api.post("/strategies", { name: "Untitled Agent", graph: { nodes: [], edges: [] } });
      router.push(`/strategies/${res.data.id}/builder`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Agents"
        description="Each agent is a graph of blocks you assemble on a canvas - the same graph is used to backtest and to paper-trade."
        actions={
          <Button onClick={createAgent} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            New Agent
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-8xl px-6 tablet:px-10 desktop:px-14">
        {isLoading && <p className="text-sm text-muted-foreground">Loading agents...</p>}
        {!isLoading && strategies?.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <Workflow className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No agents yet. Create one to start wiring up blocks.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {strategies?.map((strategy) => (
            <Link
              key={strategy.id}
              href={`/strategies/${strategy.id}/builder`}
              className="rounded-lg border border-border bg-card p-5 hover:bg-accent"
            >
              <div className="font-medium">{strategy.name}</div>
              {strategy.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{strategy.description}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Updated {new Date(strategy.updated_at).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

