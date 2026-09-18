"use client";

import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { BlockCategory, BlockSpec } from "@/types/agent";

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  source: "Sources",
  indicator: "Indicators",
  logic: "Logic",
  action: "Actions",
};

const CATEGORY_ORDER: BlockCategory[] = ["source", "indicator", "logic", "action"];

export function BlockPalette({ blocks, onAdd }: { blocks: BlockSpec[]; onAdd: (spec: BlockSpec) => void }) {
  return (
    <div className="w-64 shrink-0 overflow-auto border-r border-border bg-card p-3">
      <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Blocks</p>
      {CATEGORY_ORDER.map((category) => {
        const items = blocks.filter((b) => b.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="mb-4">
            <p className="mb-1 px-1 text-xs font-semibold text-muted-foreground">{CATEGORY_LABELS[category]}</p>
            <div className="space-y-1">
              {items.map((spec) => (
                <div
                  key={spec.type}
                  className="flex items-center gap-1 rounded-md border border-transparent pl-2 pr-1 hover:border-border hover:bg-accent"
                >
                  <button onClick={() => onAdd(spec)} className="flex-1 py-1.5 text-left text-sm">
                    {spec.label}
                  </button>
                  <InfoTooltip text={spec.description} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
