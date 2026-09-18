"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { BlockSpec } from "@/types/agent";

export type BlockNodeData = {
  spec: BlockSpec;
  config: Record<string, unknown>;
};

export type BlockNode = Node<BlockNodeData, "block">;

const CATEGORY_STYLES: Record<string, string> = {
  source: "border-l-blue-500",
  indicator: "border-l-purple-500",
  logic: "border-l-amber-500",
  action: "border-l-green-500",
};

export function BlockNodeComponent({ data, selected }: NodeProps<BlockNode>) {
  const { spec, config } = data;
  const accent = CATEGORY_STYLES[spec.category] ?? "border-l-slate-400";

  return (
    <div
      className={`min-w-[200px] rounded-md border border-border border-l-4 bg-card shadow-sm ${accent} ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="text-sm font-medium">{spec.label}</div>
          <InfoTooltip text={spec.description} />
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{spec.category}</div>
      </div>

      <div className="relative py-2">
        {spec.inputs.map((port, index) => (
          <div key={port.name} className="relative flex items-center px-3 py-1 text-xs text-muted-foreground">
            <Handle
              type="target"
              position={Position.Left}
              id={port.name}
              style={{ top: undefined }}
              className="!h-2.5 !w-2.5 !border-border !bg-background"
            />
            {port.label}
          </div>
        ))}
        {spec.outputs.map((port) => (
          <div
            key={port.name}
            className="relative flex items-center justify-end px-3 py-1 text-right text-xs text-muted-foreground"
          >
            {port.label}
            <Handle
              type="source"
              position={Position.Right}
              id={port.name}
              className="!h-2.5 !w-2.5 !border-border !bg-primary"
            />
          </div>
        ))}
      </div>

      {Object.keys(config).length > 0 && (
        <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          {Object.entries(config)
            .slice(0, 3)
            .map(([key, value]) => (
              <div key={key} className="truncate">
                {key}: <span className="text-foreground">{String(value)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
