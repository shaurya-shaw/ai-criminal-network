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
import dagre from "@dagrejs/dagre";
import {
  AlertCircle,
  Building2,
  Car,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Eye,
  EyeOff,
  FileSearch,
  Filter,
  Layers,
  LoaderCircle,
  MapPin,
  Maximize2,
  Minimize2,
  Network,
  Phone,
  RefreshCw,
  RotateCcw,
  Shield,
  Target,
  User,
  X,
} from "lucide-react";
import type {
  InvestigationGraphData,
  InvestigationGraphEdge,
  InvestigationGraphNode,
  InvestigationNodeType,
} from "@/lib/neo4j/types";

type FlowNodeData = InvestigationGraphNode & {
  isFocused?: boolean;
  evidenceCount?: number;
  [key: string]: unknown;
};
type FlowNode = Node<FlowNodeData, "investigation">;

const ICONS: Record<InvestigationNodeType, React.ElementType> = {
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

const NODE_STYLES: Record<InvestigationNodeType, string> = {
  Case: "border-cyan-400/80 bg-cyan-950/90 text-cyan-200 shadow-cyan-950/50",
  Person: "border-emerald-400/60 bg-emerald-950/80 text-emerald-200 shadow-emerald-950/40",
  Organization: "border-blue-400/60 bg-blue-950/80 text-blue-200 shadow-blue-950/40",
  Location: "border-amber-400/60 bg-amber-950/80 text-amber-200 shadow-amber-950/40",
  Phone: "border-purple-400/60 bg-purple-950/80 text-purple-200 shadow-purple-950/40",
  Vehicle: "border-teal-400/60 bg-teal-950/80 text-teal-200 shadow-teal-950/40",
  BankAccount: "border-orange-400/60 bg-orange-950/80 text-orange-200 shadow-orange-950/40",
  Evidence: "border-slate-300/50 bg-slate-900/90 text-slate-200 shadow-slate-950/40",
  Event: "border-pink-400/60 bg-pink-950/80 text-pink-200 shadow-pink-950/40",
};

function riskColor(score?: number) {
  if (typeof score !== "number") return "text-white/35";
  if (score >= 80) return "text-red-300";
  if (score >= 60) return "text-amber-300";
  return "text-cyan-300";
}

function InvestigationNodeCard({ data, selected }: NodeProps<FlowNode>) {
  const Icon = ICONS[data.type] || User;
  const isFocused = Boolean(data.isFocused);
  const evidenceCount = Number(data.evidenceCount || 0);

  return (
    <div
      className={`relative min-w-[160px] max-w-[220px] rounded border px-3 py-2.5 shadow-xl transition-all duration-200 ${
        NODE_STYLES[data.type] || NODE_STYLES.Person
      } ${
        selected || isFocused
          ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#090a0d] shadow-cyan-500/30 scale-[1.03]"
          : "hover:border-white/40"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !-left-1.5 !border !border-[#090a0d] !bg-cyan-400"
      />

      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded bg-white/10 p-1 shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold leading-tight text-white">{data.label}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[8px] font-mono uppercase tracking-wider text-white/50">{data.type}</span>
            {evidenceCount > 0 && (
              <span className="rounded bg-pink-950/70 border border-pink-500/30 px-1 py-px text-[7px] font-mono text-pink-300">
                +{evidenceCount} EVID
              </span>
            )}
          </div>
        </div>
      </div>

      {(typeof data.riskScore === "number" || typeof data.confidence === "number") && (
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-1.5 text-[9px] font-mono">
          {typeof data.riskScore === "number" ? (
            <span className={riskColor(data.riskScore)}>RISK {data.riskScore}</span>
          ) : (
            <span className="text-white/30">RISK —</span>
          )}
          {typeof data.confidence === "number" && (
            <span className="text-cyan-300/80">CONF {data.confidence}%</span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !-right-1.5 !border !border-[#090a0d] !bg-cyan-400"
      />
    </div>
  );
}

const nodeTypes = { investigation: InvestigationNodeCard };

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

function layoutDagreElements(
  nodes: FlowNode[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR"
): { nodes: FlowNode[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 140,
    nodesep: 75,
    align: "UL",
    ranker: "network-simplex",
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id) || { x: 0, y: 0 };
    const x = Math.round(nodeWithPosition.x - NODE_WIDTH / 2);
    const y = Math.round(nodeWithPosition.y - NODE_HEIGHT / 2);

    return {
      ...node,
      targetPosition: direction === "LR" ? Position.Left : Position.Top,
      sourcePosition: direction === "LR" ? Position.Right : Position.Bottom,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const HIDDEN_PROPERTIES = new Set([
  "id",
  "name",
  "title",
  "riskScore",
  "confidence",
  "caseId",
  "sourceId",
  "sourceKey",
]);

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
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [disabledRelTypes, setDisabledRelTypes] = useState<Set<string>>(new Set());
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
    setFocusedId(null);
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

  // Handle ESC key to exit fullscreen/maximize or clear focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (focusedId) {
          setFocusedId(null);
        } else if (onMaximizeChange && isMaximized) {
          onMaximizeChange(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized, isFullscreen, onMaximizeChange, focusedId]);

  // Extract all distinct relationship types present in the raw graph
  const availableRelTypes = useMemo(() => {
    const types = new Map<string, number>();
    for (const edge of graph?.edges || []) {
      const type = edge.type || "ASSOCIATED";
      types.set(type, (types.get(type) || 0) + 1);
    }
    return Array.from(types.entries()).sort((a, b) => b[1] - a[1]);
  }, [graph]);

  const toggleRelType = (type: string) => {
    setDisabledRelTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const enableAllRelTypes = () => setDisabledRelTypes(new Set());

  // Count evidence/events attached to each entity node
  const entityEvidenceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!graph) return counts;

    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source);
      const targetNode = graph.nodes.find((n) => n.id === edge.target);

      if (sourceNode && (targetNode?.type === "Evidence" || targetNode?.type === "Event")) {
        counts.set(sourceNode.id, (counts.get(sourceNode.id) || 0) + 1);
      }
      if (targetNode && (sourceNode?.type === "Evidence" || sourceNode?.type === "Event")) {
        counts.set(targetNode.id, (counts.get(targetNode.id) || 0) + 1);
      }
    }
    return counts;
  }, [graph]);

  // Compute active nodes and deduplicated edges based on filtering & focus
  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!graph) return { visibleNodes: [], visibleEdges: [] };

    // 1. Filter edges by enabled relationship types
    const edgesWithAllowedTypes = graph.edges.filter(
      (edge) => !disabledRelTypes.has(edge.type || "ASSOCIATED")
    );

    // 2. Determine allowed nodes
    const activeNodeIds = new Set<string>();

    if (focusedId) {
      // Focus mode: include focused node, direct 1-hop neighbors, and its linked evidence/events
      activeNodeIds.add(focusedId);

      for (const edge of edgesWithAllowedTypes) {
        if (edge.source === focusedId) {
          activeNodeIds.add(edge.target);
        }
        if (edge.target === focusedId) {
          activeNodeIds.add(edge.source);
        }
      }
    } else if (showAllEvidence) {
      // Show all nodes including Events and Evidence
      graph.nodes.forEach((node) => activeNodeIds.add(node.id));
    } else {
      // Default: Primary Entities and Case node only (hide Event and Evidence)
      graph.nodes
        .filter((node) => node.type !== "Event" && node.type !== "Evidence")
        .forEach((node) => activeNodeIds.add(node.id));
    }

    // Filter raw nodes
    const filteredNodes = graph.nodes.filter((node) => activeNodeIds.has(node.id));

    // Filter edges connecting visible nodes
    const candidateEdges = edgesWithAllowedTypes.filter(
      (edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)
    );

    // 3. Deduplicate bidirectional edges (e.g. A->B and B->A of same type)
    const deduplicatedEdges: Edge[] = [];
    const seenPairs = new Set<string>();

    for (const edge of candidateEdges) {
      const pairKey1 = `${edge.source}::${edge.target}::${edge.type}`;
      const pairKey2 = `${edge.target}::${edge.source}::${edge.type}`;

      const isMutual = candidateEdges.some(
        (other) =>
          other !== edge &&
          other.source === edge.target &&
          other.target === edge.source &&
          other.type === edge.type
      );

      if (seenPairs.has(pairKey1) || seenPairs.has(pairKey2)) {
        continue;
      }

      seenPairs.add(pairKey1);
      if (isMutual) {
        seenPairs.add(pairKey2);
      }

      const isSpecialAnimated =
        edge.type === "CALLED" || edge.type === "TRANSFERRED_TO";

      deduplicatedEdges.push({
        id: isMutual ? `bidir-${edge.id}` : edge.id,
        source: edge.source,
        target: edge.target,
        label: isMutual ? `↔ ${edge.label || edge.type}` : edge.label || edge.type,
        type: "smoothstep",
        animated: isSpecialAnimated,
        markerStart: isMutual
          ? { type: MarkerType.ArrowClosed, color: "rgba(56, 189, 248, 0.85)" }
          : undefined,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isMutual ? "rgba(56, 189, 248, 0.85)" : "rgba(148, 163, 184, 0.75)",
        },
        labelStyle: {
          fill: isMutual ? "#38bdf8" : "#cbd5e1",
          fontSize: 9,
          fontFamily: "var(--font-geist-mono), monospace",
        },
        labelBgStyle: { fill: "#111218", fillOpacity: 0.94 },
        labelBgPadding: [4, 2],
        style: {
          stroke: isMutual ? "rgba(56, 189, 248, 0.7)" : "rgba(148, 163, 184, 0.55)",
          strokeWidth: isMutual ? 1.6 : 1.2,
        },
      });
    }

    // Convert to FlowNode objects
    const flowNodes: FlowNode[] = filteredNodes.map((node) => ({
      id: node.id,
      type: "investigation",
      position: { x: 0, y: 0 },
      data: {
        ...node,
        isFocused: node.id === focusedId,
        evidenceCount: entityEvidenceCounts.get(node.id) || 0,
      },
    }));

    return { visibleNodes: flowNodes, visibleEdges: deduplicatedEdges };
  }, [graph, disabledRelTypes, focusedId, showAllEvidence, entityEvidenceCounts]);

  // 4. Compute Dagre Hierarchical Layout (Left-to-Right)
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return layoutDagreElements(visibleNodes, visibleEdges, "LR");
  }, [visibleNodes, visibleEdges]);

  const selected = graph?.nodes.find((node) => node.id === selectedId) || null;
  const focusedNode = graph?.nodes.find((node) => node.id === focusedId) || null;
  const hasInvestigationData = Boolean(graph?.nodes.some((node) => node.type !== "Case"));

  const heightClass = isEffectiveMaximized ? "h-[680px]" : "h-[540px]";

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
    // If user clicks an Entity, toggle focusing that entity to branch its connected evidence/events
    if (focusedId === node.id) {
      setFocusedId(null);
    } else {
      setFocusedId(node.id);
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] flex h-screen w-screen flex-col overflow-hidden bg-[#07080a]"
          : `flex flex-col xl:flex-row ${heightClass} w-full overflow-hidden bg-[#090a0d]`
      }
      style={{ minHeight: isEffectiveMaximized ? "680px" : "540px" }}
    >
      {/* Left / Main: React Flow Canvas Container */}
      <div className="relative flex-1 min-w-0 h-full w-full flex flex-col overflow-hidden bg-[#090a0d]">
        {/* Top Control Bar: Relationship Filter Pills & Evidence Toggle */}
        <div className="z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-[#0c0d12]/95 px-3 py-2 text-[10px] font-mono backdrop-blur">
          {/* Left: Focus / Evidence Quick Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShowAllEvidence(!showAllEvidence)}
              className={`flex items-center gap-1 border px-2 py-1 transition-all cursor-pointer ${
                showAllEvidence
                  ? "border-pink-500/50 bg-pink-950/60 text-pink-200"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
              }`}
              title="Toggle global display of all Event & Evidence nodes"
            >
              {showAllEvidence ? <Eye className="h-3 w-3 text-pink-400" /> : <EyeOff className="h-3 w-3 text-white/40" />}
              <span>{showAllEvidence ? "ALL EVIDENCE VISIBLE" : "SHOW ALL EVIDENCE"}</span>
            </button>

            {focusedNode && (
              <div className="flex items-center gap-1.5 border border-cyan-400/50 bg-cyan-950/70 px-2 py-1 text-cyan-200 font-semibold shadow-sm">
                <Target className="h-3 w-3 text-cyan-400 animate-pulse" />
                <span className="truncate max-w-[140px]">FOCUS: {focusedNode.label}</span>
                <button
                  onClick={() => setFocusedId(null)}
                  className="ml-1 text-cyan-400/60 hover:text-white cursor-pointer"
                  title="Clear entity focus"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Relationship-type filter pills */}
          <div className="flex flex-wrap items-center gap-1 overflow-x-auto max-w-full">
            <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase tracking-widest mr-1">
              <Filter className="h-2.5 w-2.5" />
              <span>RELATIONS:</span>
            </div>

            {availableRelTypes.map(([type, count]) => {
              const isDisabled = disabledRelTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleRelType(type)}
                  className={`flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[8.5px] transition-all cursor-pointer ${
                    !isDisabled
                      ? "border-cyan-500/30 bg-cyan-950/40 text-cyan-200"
                      : "border-white/[0.06] bg-white/[0.01] text-white/30 hover:border-white/15"
                  }`}
                  title={`${isDisabled ? "Enable" : "Hide"} ${type} relationships`}
                >
                  {!isDisabled && <Check className="h-2.5 w-2.5 text-cyan-400" />}
                  <span>{type}</span>
                  <span className="text-white/40 font-bold">({count})</span>
                </button>
              );
            })}

            {disabledRelTypes.size > 0 && (
              <button
                onClick={enableAllRelTypes}
                className="flex items-center gap-1 border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[8.5px] text-white/60 hover:border-cyan-400 hover:text-white cursor-pointer ml-1"
                title="Enable all relationship types"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>RESET</span>
              </button>
            )}
          </div>
        </div>

        {/* Canvas Body */}
        <div className="relative flex-1 min-w-0 w-full h-full overflow-hidden bg-[#090a0d]">
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

          {/* React Flow Canvas */}
          <div className="w-full h-full" style={{ width: "100%", height: "100%" }}>
            <ReactFlow
              nodes={layoutedNodes}
              edges={layoutedEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2, maxZoom: 1.15 }}
              minZoom={0.15}
              maxZoom={2.25}
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
              onNodeClick={handleNodeClick}
              onPaneClick={() => {
                setSelectedId(null);
                setFocusedId(null);
              }}
              proOptions={{ hideAttribution: true }}
              style={{ width: "100%", height: "100%" }}
            >
              <Background color="rgba(148, 163, 184, 0.09)" gap={24} size={1} />
              <Controls
                showInteractive={false}
                className="!border-white/10 !bg-[#111218] !fill-white/65 [&>button]:!border-white/10 [&>button]:!bg-[#111218] [&>button]:hover:!bg-white/10"
              />
            </ReactFlow>
          </div>

          {/* Bottom Control Bar: Live Node Stats on Left, Maximize/Restore Button on Right */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            {/* Node & Edge stats tag */}
            <div className="pointer-events-auto flex items-center gap-2 border border-white/10 bg-[#111218]/90 backdrop-blur px-2.5 py-1 text-[9px] font-mono text-white/50 shadow">
              <span>{visibleNodes.length} NODES ({graph?.nodes.length || 0} TOTAL)</span>
              <span>·</span>
              <span>{visibleEdges.length} EDGES</span>
              {focusedNode && (
                <>
                  <span>·</span>
                  <span className="text-cyan-400 font-semibold">1-HOP ISOLATED</span>
                </>
              )}
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
      </div>

      {/* Right: Forensic Details Inspector Panel */}
      {!compact && (
        <aside
          className={
            isFullscreen
              ? selected
                ? "absolute top-12 right-4 bottom-14 z-30 w-80 overflow-y-auto border border-white/20 bg-[#0c0d12]/95 backdrop-blur-md shadow-2xl p-4"
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

              {/* Quick Focus Button */}
              {selected.type !== "Case" && (
                <button
                  onClick={() => setFocusedId(focusedId === selected.id ? null : selected.id)}
                  className={`w-full flex items-center justify-center gap-1.5 border px-2.5 py-1.5 text-[10px] transition-all cursor-pointer ${
                    focusedId === selected.id
                      ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 font-bold"
                      : "border-white/10 bg-white/[0.02] text-white/70 hover:border-cyan-500/30 hover:text-white"
                  }`}
                >
                  <Target className="h-3 w-3 text-cyan-400" />
                  <span>{focusedId === selected.id ? "RESET FOCUS (SHOW ALL)" : "FOCUS SUB-NETWORK"}</span>
                </button>
              )}

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
                      !HIDDEN_PROPERTIES.has(key) && value !== null && value !== undefined && value !== ""
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
                CLICK ANY NODE TO INSPECT ATTRIBUTES & ISOLATE ITS SUB-NETWORK
              </p>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
