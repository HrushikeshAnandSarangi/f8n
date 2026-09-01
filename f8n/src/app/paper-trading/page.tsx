"use client";

import Link from "next/link";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { fetcher } from "@/lib/swr";
import type { PaperSession } from "@/types/agent";

const STATUS_STYLES: Record<string, string> = {
  running: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  stopped: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function PaperTradingListPage() {
  const { data: sessions } = useSWR<PaperSession[]>("/paper-sessions", fetcher, { refreshInterval: 5000 });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Paper Trading"
        description="Live agents running against Binance Testnet + simulated fills. No real funds are ever used."
      />

      <div className="mx-auto w-full max-w-8xl px-6 tablet:px-10 desktop:px-14">
        <div className="rounded-lg border border-border bg-card">
          <div className="divide-y divide-border">
            {sessions?.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                No paper sessions yet. Deploy an agent from its builder page to start one.
              </p>
            )}
            {sessions?.map((session) => (
              <Link
                key={session.id}
                href={`/paper-trading/${session.id}`}
                className="flex items-center justify-between p-4 hover:bg-accent"
              >
                <div>
                  <div className="font-medium">Session #{session.id} - Agent #{session.strategy_id}</div>
                  <div className="text-xs text-muted-foreground">
                    Started {new Date(session.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[session.status]}`}>
                  {session.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

