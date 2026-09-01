"use client";

import "@xyflow/react/dist/style.css";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { PlayCircle, Rocket, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { BlockNodeComponent, type BlockNode } from "@/components/agent-builder/block-node";
import { BlockPalette } from "@/components/agent-builder/block-palette";
import { ConfigPanel } from "@/components/agent-builder/config-panel";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr";
import type { BlockSpec, GraphEdgeData, Strategy, StrategyGraph } from "@/types/agent";

const nodeTypes = { block: BlockNodeComponent };

function defaultConfigFor(spec: BlockSpec): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(spec.config_schema.properties || {})) {
    if (schema.default !== undefined) config[key] = schema.default;
  }
  return config;
}

function graphToFlow(graph: StrategyGraph, specByType: Map<string, BlockSpec>) {
  const nodes: BlockNode[] = graph.nodes
    .filter((n) => specByType.has(n.type))
    .map((n, index) => ({
      id: n.id,
      type: "block",
      position: n.position ?? { x: 120 + (index % 4) * 240, y: 120 + Math.floor(index / 4) * 180 },
      data: { spec: specByType.get(n.type)!, config: n.config || {} },
    }));

  const edges: Edge[] = graph.edges.map((e, index) => ({
    id: `e${index}-${e.source}-${e.sourceHandle}-${e.target}-${e.targetHandle}`,
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
  }));

  return { nodes, edges };
}

function BuilderInner() {
  const params = useParams<{ id: string }>();
  const strategyId = params.id;
  const router = useRouter();

  const { data: blocks } = useSWR<BlockSpec[]>("/blocks/", fetcher);
  const { data: strategy } = useSWR<Strategy>(`/strategies/${strategyId}`, fetcher);

  const specByType = useMemo(() => new Map((blocks || []).map((b) => [b.type, b])), [blocks]);

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nodes, setNodes] = useState<BlockNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showBacktestModal, setShowBacktestModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  useEffect(() => {
    if (strategy && blocks && loadedFor !== strategyId) {
      const { nodes: initialNodes, edges: initialEdges } = graphToFlow(
        strategy.graph || { nodes: [], edges: [] },
        specByType,
      );
      setName(strategy.name);
      setNodes(initialNodes);
      setEdges(initialEdges);
      setLoadedFor(strategyId);
    }
  }, [strategy, blocks, specByType, strategyId, loadedFor]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BlockNode>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), []);

  const addBlock = (spec: BlockSpec) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const index = nodes.length;
    const node: BlockNode = {
      id,
      type: "block",
      position: { x: 140 + (index % 4) * 240, y: 140 + Math.floor(index / 4) * 180 },
      data: { spec, config: defaultConfigFor(spec) },
    };
    setNodes((nds) => [...nds, node]);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const updateSelectedConfig = (config: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, config } } : n)));
  };

  const deleteSelected = () => {
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const buildGraph = (): StrategyGraph => ({
    nodes: nodes.map((n) => ({ id: n.id, type: n.data.spec.type, config: n.data.config, position: n.position })),
    edges: edges
      .filter((e) => e.sourceHandle && e.targetHandle)
      .map(
        (e): GraphEdgeData => ({
          source: e.source,
          sourceHandle: e.sourceHandle!,
          target: e.target,
          targetHandle: e.targetHandle!,
        }),
      ),
  });

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/strategies/${strategyId}`, { name, graph: buildGraph() });
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  if (!strategy || !blocks) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading agent...</div>;
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-medium hover:border-input focus:border-input focus:outline-none"
        />
        <div className="flex items-center gap-2">
          {savedAt && <span className="text-xs text-muted-foreground">Saved {savedAt.toLocaleTimeString()}</span>}
          <Button variant="outline" size="sm" onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBacktestModal(true)}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Backtest
          </Button>
          <Button size="sm" onClick={() => setShowDeployModal(true)}>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy as Paper Agent
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <BlockPalette blocks={blocks} onAdd={addBlock} />

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable className="!bg-card" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onChange={updateSelectedConfig}
            onDelete={deleteSelected}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {showBacktestModal && (
        <BacktestModal
          strategyId={strategyId}
          onClose={() => setShowBacktestModal(false)}
          onStarted={(runId) => router.push(`/backtest/${runId}`)}
        />
      )}
      {showDeployModal && (
        <DeployModal
          strategyId={strategyId}
          onClose={() => setShowDeployModal(false)}
          onStarted={(sessionId) => router.push(`/paper-trading/${sessionId}`)}
        />
      )}
    </div>
  );
}

function BacktestModal({
  strategyId,
  onClose,
  onStarted,
}: {
  strategyId: string;
  onClose: () => void;
  onStarted: (runId: number) => void;
}) {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(weekAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [startingCapital, setStartingCapital] = useState(10000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/backtests", {
        strategy_id: Number(strategyId),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        starting_capital: startingCapital,
      });
      onStarted(res.data.id);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not start backtest");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Run a backtest" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </Field>
        <Field label="Starting capital ($)">
          <input
            type="number"
            value={startingCapital}
            onChange={(e) => setStartingCapital(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Starting..." : "Run backtest"}
        </Button>
      </div>
    </Modal>
  );
}

function DeployModal({
  strategyId,
  onClose,
  onStarted,
}: {
  strategyId: string;
  onClose: () => void;
  onStarted: (sessionId: number) => void;
}) {
  const [startingCapital, setStartingCapital] = useState(10000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/paper-sessions", {
        strategy_id: Number(strategyId),
        starting_capital: startingCapital,
      });
      onStarted(res.data.id);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not deploy agent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Deploy as paper agent" onClose={onClose}>
      <div className="space-y-4">
        <p className="rounded-md bg-amber-100 p-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          PAPER / TESTNET only. Orders on Binance use the Binance Testnet (fake funds); any other exchange leg is
          simulated against live prices. No real money is ever used.
        </p>
        <Field label="Starting paper capital ($)">
          <input
            type="number"
            value={startingCapital}
            onChange={(e) => setStartingCapital(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? "Deploying..." : "Deploy agent"}
        </Button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}
