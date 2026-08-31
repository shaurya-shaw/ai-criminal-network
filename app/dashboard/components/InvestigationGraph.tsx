"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertCircle,
  Building2,
  Car,
  CircleDollarSign,
  ClipboardList,
  FileSearch,
  LoaderCircle,
  MapPin,
  Maximize2,
  Minimize2,
  Network,
  Phone,
  RefreshCw,
  Shield,
  User,
  X,
} from "lucide-react";
import type {
  InvestigationGraphData,
  InvestigationGraphNode,
  InvestigationNodeType,
} from "@/lib/neo4j/types";

type FlowNodeData = InvestigationGraphNode & Record<string, unknown>;
type FlowNode = Node<FlowNodeData, "investigation">;

const icons: Record<InvestigationNodeType, React.ElementType> = {
  Case: Shield,
  Person: User,
  Organization: Building2,
  Location: MapPin,
  Phone,
  Vehicle: Car,
  BankAccount: CircleDollarSign,
  Evidence: FileSearch,
  Event: ClipboardList,
};

const nodeStyles: Record<InvestigationNodeType, string> = {
  Case: "border-cyan-400/70 bg-cyan-950/90 text-cyan-200",
  Person: "border-emerald-400/50 bg-emerald-950/70 text-emerald-200",
  Organization: "border-blue-400/50 bg-blue-950/70 text-blue-200",
  Location: "border-amber-400/50 bg-amber-950/70 text-amber-200",
  Phone: "border-purple-400/50 bg-purple-950/70 text-purple-200",
  Vehicle: "border-teal-400/50 bg-teal-950/70 text-teal-200",
  BankAccount: "border-orange-400/50 bg-orange-950/70 text-orange-200",
  Evidence: "border-slate-300/40 bg-slate-900/90 text-slate-200",
  Event: "border-pink-400/50 bg-pink-950/70 text-pink-200",
};

function riskColor(score?: number) {
  if (typeof score !== "number") return "text-white/35";
  if (score >= 80) return "text-red-300";
  if (score >= 60) return "text-amber-300";
  return "text-cyan-300";
}

function InvestigationNodeCard({ data, selected }: NodeProps<FlowNode>) {
  const Icon = icons[data.type];
  return (
    <div
      className={`min-w-[152px] max-w-[210px] border px-3 py-2.5 shadow-xl transition-shadow ${nodeStyles[data.type]} ${
        selected ? "ring-2 ring-white/80 shadow-cyan-400/20" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-white/50" />
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold leading-tight text-white">{data.label}</p>
          <p className="mt-1 text-[8px] font-mono uppercase tracking-widest text-white/45">{data.type}</p>
        </div>
      </div>
      {(typeof data.riskScore === "number" || typeof data.confidence === "number") && (
        <div className="mt-2 flex gap-2 border-t border-white/10 pt-1.5 text-[9px] font-mono">
          {typeof data.riskScore === "number" && <span className={riskColor(data.riskScore)}>RISK {data.riskScore}</span>}
          {typeof data.confidence === "number" && <span className="text-white/45">CONF {data.confidence}%</span>}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-white/50" />
    </div>
  );
}

const nodeTypes = { investigation: InvestigationNodeCard };

function layoutNodes(graphNodes: InvestigationGraphNode[]): FlowNode[] {
  const ordered = [...graphNodes].sort((left, right) => {
    if (left.type === "Case") return -1;
    if (right.type === "Case") return 1;
    return left.label.localeCompare(right.label);
  });
  const caseNode = ordered.find((node) => node.type === "Case");
  const otherNodes = ordered.filter((node) => node.id !== caseNode?.id);

  return ordered.map((node) => {
    let position = { x: 0, y: 0 };
    if (node.id !== caseNode?.id) {
      const index = otherNodes.findIndex((item) => item.id === node.id);
      const ring = Math.floor(index / 8) + 1;
      const nodesBeforeRing = (ring - 1) * 8;
      const inRing = index - nodesBeforeRing;
      const nodeCount = Math.min(8, otherNodes.length - nodesBeforeRing);
      const angle = (Math.PI * 2 * inRing) / Math.max(nodeCount, 1) - Math.PI / 2;
      const radius = 235 + (ring - 1) * 170;
      position = { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
    }
    return { id: node.id, type: "investigation", position, data: node as FlowNodeData };
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const hiddenProperties = new Set(["id", "name", "title", "riskScore", "confidence", "caseId", "sourceId", "sourceKey"]);

interface InvestigationGraphProps {
  caseId: string;
  onGraphChange?: (graph: InvestigationGraphData) => void;
  onMaximizeChange?: (maximized: boolean) => void;
  isMaximized?: boolean;
  compact?: boolean;
}

export default function InvestigationGraph({
  caseId,
  onGraphChange,
  onMaximizeChange,
  isMaximized = false,
  compact = false,
}: InvestigationGraphProps) {
  const [graph, setGraph] = useState<InvestigationGraphData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isEffectiveMaximized = isMaximized || isFullscreen;

  const handleToggleMaximize = useCallback(() => {
    if (onMaximizeChange) {
      onMaximizeChange(!isMaximized);
    } else {
      setIsFullscreen(!isFullscreen);
    }
  }, [onMaximizeChange, isMaximized, isFullscreen]);

  const loadGraph = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    try {
      const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/network`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || payload.details || "Unable to load graph.");
      const nextGraph: InvestigationGraphData = {
        nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
        edges: Array.isArray(payload.edges) ? payload.edges : [],
      };
      setGraph(nextGraph);
      onGraphChange?.(nextGraph);
    } catch (loadError) {
      setGraph(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load graph.");
    } finally {
      setLoading(false);
    }
  }, [caseId, onGraphChange]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  // Handle ESC key to exit fullscreen/maximize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onMaximizeChange && isMaximized) {
          onMaximizeChange(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, isFullscreen, onMaximizeChange]);

  const nodes = useMemo(() => layoutNodes(graph?.nodes || []), [graph]);
  const edges = useMemo<Edge[]>(
    () =>
      (graph?.edges || []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        animated: edge.type === "CALLED" || edge.type === "TRANSFERRED_TO",
        markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(148, 163, 184, 0.75)" },
        labelStyle: { fill: "#cbd5e1", fontSize: 9, fontFamily: "var(--font-geist-mono), monospace" },
        labelBgStyle: { fill: "#111218", fillOpacity: 0.92 },
        labelBgPadding: [3, 2],
        style: { stroke: "rgba(148, 163, 184, 0.55)", strokeWidth: 1.2 },
      })),
    [graph],
  );
  const selected = graph?.nodes.find((node) => node.id === selectedId) || null;
  const hasInvestigationData = Boolean(graph?.nodes.some((node) => node.type !== "Case"));

  const heightClass = isEffectiveMaximized ? "h-[680px]" : "h-[540px]";

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] flex h-screen w-screen overflow-hidden bg-[#07080a]"
          : `flex flex-col xl:flex-row ${heightClass} w-full overflow-hidden bg-[#090a0d]`
      }
      style={{ minHeight: isEffectiveMaximized ? "680px" : "540px" }}
    >
      {/* Left / Main: React Flow Canvas Container with explicit 100% height */}
      <div className="relative flex-1 min-w-0 h-full w-full overflow-hidden bg-[#090a0d]" style={{ height: "100%" }}>
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#090a0d]/95">
            <LoaderCircle className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="text-[10px] font-mono tracking-widest text-white/45">
              SYNCHRONIZING INVESTIGATION GRAPH
            </span>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertCircle className="h-7 w-7 text-red-400" />
            <p className="max-w-sm text-[11px] font-mono text-white/55">{error}</p>
            <button
              onClick={() => void loadGraph()}
              className="inline-flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-[10px] font-mono text-cyan-300 hover:bg-cyan-950/60 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> RETRY
            </button>
          </div>
        )}

        {!loading && !error && !hasInvestigationData && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Network className="h-8 w-8 text-cyan-400/45" />
            <div>
              <p className="text-[11px] font-semibold text-white/75">NO GRAPH ENTITIES YET</p>
              <p className="mt-1 max-w-sm text-[10px] font-mono text-white/35">
                Process an FIR or another intelligence source to populate this case’s investigation graph.
              </p>
            </div>
          </div>
        )}

        {/* React Flow Canvas with 100% width and height */}
        <div className="w-full h-full" style={{ width: "100%", height: "100%" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25, maxZoom: 1.15 }}
            minZoom={0.15}
            maxZoom={2.25}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            proOptions={{ hideAttribution: true }}
            style={{ width: "100%", height: "100%" }}
          >
            <Background color="rgba(148, 163, 184, 0.12)" gap={22} size={1} />
            <Controls
              showInteractive={false}
              className="!border-white/10 !bg-[#111218] !fill-white/65 [&>button]:!border-white/10 [&>button]:!bg-[#111218] [&>button]:hover:!bg-white/10"
            />
          </ReactFlow>
        </div>

        {/* Bottom Control Bar: Node Stats on Left, Maximize/Restore Button on Right */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          {/* Node & Edge stats tag */}
          <div className="pointer-events-auto border border-white/10 bg-[#111218]/90 backdrop-blur px-2.5 py-1 text-[9px] font-mono text-white/50 shadow">
            {graph?.nodes.length || 0} NODES · {graph?.edges.length || 0} EDGES
          </div>

          {/* Bottom Maximize / Restore Button */}
          <button
            onClick={handleToggleMaximize}
            className="pointer-events-auto flex items-center gap-1.5 border border-cyan-500/40 bg-[#111218]/95 px-3 py-1.5 text-[10px] font-mono font-semibold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 hover:text-white transition-all shadow-lg backdrop-blur cursor-pointer"
            title={isEffectiveMaximized ? "Restore View (ESC)" : "Maximize Canvas (Hide Cases Sidebar)"}
          >
            {isEffectiveMaximized ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>RESTORE VIEW</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>MAXIMIZE CANVAS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right: Forensic Details Inspector Panel */}
      {!compact && (
        <aside
          className={
            isFullscreen
              ? selected
                ? "absolute top-4 right-4 bottom-14 z-30 w-80 overflow-y-auto border border-white/20 bg-[#0c0d12]/95 backdrop-blur-md shadow-2xl p-4"
                : "hidden"
              : "w-full xl:w-80 shrink-0 h-full overflow-y-auto border-t xl:border-t-0 xl:border-l border-white/[0.1] bg-[#0c0d12] p-4"
          }
          style={{ height: "100%" }}
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-2 mb-3">
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase font-semibold">
              FORENSIC DETAILS
            </span>
            {selected && (
              <button
                onClick={() => setSelectedId(null)}
                className="text-white/35 hover:text-white cursor-pointer"
                title="Close inspector"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {selected ? (
            <div className="space-y-4 font-mono">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-cyan-300/70 font-bold">{selected.type}</p>
                <p className="mt-1 break-words text-sm font-semibold text-white">{selected.label}</p>
                <p className="mt-1 text-[9px] text-white/30">{String(selected.properties.extractedId || selected.id)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-white/[0.08] bg-white/[0.025] p-2">
                  <p className="text-[8px] text-white/35">RISK SCORE</p>
                  <p className={`mt-1 text-sm font-bold ${riskColor(selected.riskScore)}`}>
                    {selected.riskScore ?? "—"}
                  </p>
                </div>
                <div className="border border-white/[0.08] bg-white/[0.025] p-2">
                  <p className="text-[8px] text-white/35">CONFIDENCE</p>
                  <p className="mt-1 text-sm font-bold text-cyan-200">
                    {selected.confidence !== undefined ? `${selected.confidence}%` : "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 border-t border-white/[0.07] pt-3">
                {Object.entries(selected.properties)
                  .filter(
                    ([key, value]) =>
                      !hiddenProperties.has(key) && value !== null && value !== undefined && value !== ""
                    )
                  .map(([key, value]) => (
                    <div key={key} className="border-b border-white/[0.03] pb-1.5">
                      <p className="text-[8px] uppercase text-white/30 tracking-wider">
                        {key.replace(/([A-Z])/g, " $1")}
                      </p>
                      <p className="mt-0.5 break-words text-[10px] leading-relaxed text-white/70">
                        {formatValue(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-4 text-center">
              <Network className="mb-2 h-5 w-5 text-white/20" />
              <p className="text-[10px] font-mono text-white/35 leading-relaxed">
                SELECT ANY NODE TO INSPECT ITS FORENSIC ATTRIBUTES
              </p>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
