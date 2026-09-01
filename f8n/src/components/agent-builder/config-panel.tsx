"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlockNode } from "./block-node";

export function ConfigPanel({
  node,
  onChange,
  onDelete,
  onClose,
}: {
  node: BlockNode;
  onChange: (config: Record<string, unknown>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { spec, config } = node.data;
  const properties = spec.config_schema.properties || {};

  const updateField = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <div className="font-medium">{spec.label}</div>
          <div className="text-xs text-muted-foreground">{spec.description}</div>
        </div>
        <button onClick={onClose} className="rounded p-1 hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {Object.keys(properties).length === 0 && (
          <p className="text-sm text-muted-foreground">This block has no configuration.</p>
        )}
        {Object.entries(properties).map(([key, schema]) => {
          const value = config[key] ?? schema.default ?? "";
          return (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium capitalize text-muted-foreground">
                {key.replace(/_/g, " ")}
              </label>
              {schema.enum ? (
                <select
                  value={String(value)}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  {schema.enum.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : schema.type === "number" ? (
                <input
                  type="number"
                  step="any"
                  value={Number(value)}
                  onChange={(e) => updateField(key, e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
              ) : (
                <input
                  type="text"
                  value={String(value)}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-4">
        <Button variant="destructive" size="sm" onClick={onDelete} className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete block
        </Button>
      </div>
    </div>
  );
}
