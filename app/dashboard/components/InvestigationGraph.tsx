"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
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
  CircleDollarSign,
  ClipboardList,
  Eye,
  EyeOff,
  FileSearch,
  Filter,
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
  Zap,
} from "lucide-react";
import type {
  InvestigationGraphData,
  InvestigationGraphEdge,
  InvestigationGraphNode,
  InvestigationNodeType,
} from "@/lib/neo4j/types";

// ─── 3 Consistent Semantic Categories ──────────────────────────────────────────
// 1. Social / Communications / Core: Cyan (#38bdf8)
// 2. Financial / Corporate:           Amber (#fbbf24)
// 3. Incidents / Evidence / Spatial:  Rose (#fb7185)

export type SemanticCategory = "social" | "financial" | "incident";

export function getEntityCategory(type: InvestigationNodeType): SemanticCategory {
  if (type === "BankAccount") return "financial";
  if (type === "Evidence" || type === "Event" || type === "Location") return "incident";
  return "social"; // Case, Person, Organization, Phone, Vehicle
}

export function getEdgeCategory(type: string): SemanticCategory {
  const norm = (type || "").replace(/\s+/g, "_").toUpperCase();
  if (
    norm.includes("TRANSFER") ||
    norm.includes("OWN") ||
    norm.includes("WORK") ||
    norm.includes("PAY") ||
    norm.includes("FINANC") ||
    norm.includes("FUND") ||
    norm.includes("TRANSACTION")
  ) {
    return "financial";
  }
  if (
    norm.includes("INVOLV") ||
    norm.includes("OCCUR") ||
    norm.includes("VISIT") ||
    norm.includes("MENTION") ||
    norm.includes("SCENE") ||
    norm.includes("EVENT") ||
    norm.includes("INCIDENT")
  ) {
    return "incident";
  }
  return "social"; // CALLED, KNOWS, ASSOCIATED_WITH, SPOUSE_OF, etc.
}

interface CategoryVisualConfig {
  nodeBorder: string;
  nodeBorderHighRisk: string;
  nodeBg: string;
  nodeText: string;
  nodeGlow: string;
  iconBg: string;
  iconColor: string;
  handleColor: string;
  edgeStroke: string;
  edgeStrokeActive: string;
  edgeArrow: string;
  edgeText: string;
  edgeBg: string;
  pillBorder: string;
  pillBg: string;
  pillText: string;
  dotColor: string;
}

const CATEGORY_THEMES: Record<SemanticCategory, CategoryVisualConfig> = {
  // 1. Communications, Social Network & Core Identity (Electric Cyan)
  social: {
    nodeBorder: "border-cyan-500/40 hover:border-cyan-400",
    nodeBorderHighRisk: "border-2 border-cyan-400 shadow-lg shadow-cyan-950/80 ring-1 ring-cyan-400/40",
    nodeBg: "bg-[#07131e]/95",
    nodeText: "text-cyan-200",
    nodeGlow: "shadow-cyan-950/50",
    iconBg: "bg-cyan-500/15 border border-cyan-500/30",
    iconColor: "text-cyan-300",
    handleColor: "!bg-cyan-400",
    edgeStroke: "rgba(56, 189, 248, 0.55)",
    edgeStrokeActive: "rgba(56, 189, 248, 0.95)",
    edgeArrow: "rgba(56, 189, 248, 0.9)",
    edgeText: "#38bdf8",
    edgeBg: "#061521",
    pillBorder: "border-cyan-500/40",
    pillBg: "bg-cyan-950/50",
    pillText: "text-cyan-200",
    dotColor: "bg-cyan-400",
  },
  // 2. Financial Accounts & Ownership Flows (Warm Gold / Amber)
  financial: {
    nodeBorder: "border-amber-500/40 hover:border-amber-400",
    nodeBorderHighRisk: "border-2 border-amber-400 shadow-lg shadow-amber-950/80 ring-1 ring-amber-400/40",
    nodeBg: "bg-[#181105]/95",
    nodeText: "text-amber-200",
    nodeGlow: "shadow-amber-950/50",
    iconBg: "bg-amber-500/15 border border-amber-500/30",
    iconColor: "text-amber-300",
    handleColor: "!bg-amber-400",
    edgeStroke: "rgba(245, 158, 11, 0.55)",
    edgeStrokeActive: "rgba(251, 191, 36, 0.95)",
    edgeArrow: "rgba(245, 158, 11, 0.9)",
    edgeText: "#fbbf24",
    edgeBg: "#1c1409",
    pillBorder: "border-amber-500/40",
    pillBg: "bg-amber-950/50",
    pillText: "text-amber-200",
    dotColor: "bg-amber-400",
  },
  // 3. Incidents, Crime Scenes, Events & Evidence (Vibrant Rose / Magenta)
  incident: {
    nodeBorder: "border-rose-500/40 hover:border-rose-400",
    nodeBorderHighRisk: "border-2 border-rose-400 shadow-lg shadow-rose-950/80 ring-1 ring-rose-400/40",
    nodeBg: "bg-[#1f0812]/95",
    nodeText: "text-rose-200",
    nodeGlow: "shadow-rose-950/50",
    iconBg: "bg-rose-500/15 border border-rose-500/30",
    iconColor: "text-rose-300",
    handleColor: "!bg-rose-400",
    edgeStroke: "rgba(244, 63, 94, 0.55)",
    edgeStrokeActive: "rgba(251, 113, 133, 0.95)",
    edgeArrow: "rgba(244, 63, 94, 0.9)",
    edgeText: "#fb7185",
    edgeBg: "#220812",
    pillBorder: "border-rose-500/40",
    pillBg: "bg-rose-950/50",
    pillText: "text-rose-200",
    dotColor: "bg-rose-400",
  },
};

const STRUCTURAL_RELATIONSHIPS = new Set([
  "HAS_ENTITY",
  "HAS_EVIDENCE",
  "HAS_EVENT",
  "HAS_MEMBER",
  "HAS ENTITY",
  "HAS EVIDENCE",
  "HAS EVENT",
  "HAS MEMBER",
]);

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

type FlowNodeData = InvestigationGraphNode & {
  isFocused?: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  evidenceCount?: number;
  [key: string]: unknown;
};
type FlowNode = Node<FlowNodeData, "investigation">;

function InvestigationNodeCard({ data, selected }: NodeProps<FlowNode>) {
  const Icon = ICONS[data.type] || User;
  const isFocused = Boolean(data.isFocused);
  const isDimmed = Boolean(data.isDimmed);
  const isHighlighted = Boolean(data.isHighlighted);
  const isHighRisk = typeof data.riskScore === "number" && data.riskScore >= 75;
  const isCaseNode = data.type === "Case";
  const evidenceCount = Number(data.evidenceCount || 0);

  const category = getEntityCategory(data.type);
  const theme = CATEGORY_THEMES[category];

  return (
    <div
      className={`relative min-w-[190px] max-w-[240px] rounded-md transition-all duration-200 select-none ${
        theme.nodeBg
      } ${
        isHighRisk ? theme.nodeBorderHighRisk : `border ${theme.nodeBorder}`
      } ${
        isDimmed
          ? "opacity-20 filter grayscale-[60%] pointer-events-none"
          : isHighlighted || selected || isFocused
          ? "ring-2 ring-white/80 ring-offset-2 ring-offset-[#090a0d] shadow-2xl scale-[1.03] z-20"
          : "hover:scale-[1.015] shadow-lg " + theme.nodeGlow
      } ${isCaseNode ? "ring-1 ring-cyan-400/50" : ""}`}
      style={{
        padding: isHighRisk ? "10px 12px" : "8px 10px",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-2.5 !w-2.5 !-left-1.5 !border !border-[#090a0d] ${theme.handleColor}`}
      />

      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-white/[0.07]">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`p-1 rounded shrink-0 ${theme.iconBg} ${theme.iconColor}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className={`text-[8.5px] font-mono font-semibold uppercase tracking-wider ${theme.nodeText}`}>
            {data.type}
          </span>
        </div>

        {isHighRisk && (
          <span
            className={`flex items-center gap-0.5 rounded px-1 py-0.5 text-[7px] font-mono font-bold tracking-widest uppercase ${theme.iconBg} ${theme.nodeText}`}
            title="High Priority Target"
          >
            <Zap className="h-2 w-2" /> CRITICAL
          </span>
        )}

        {isCaseNode && (
          <span className="rounded bg-cyan-500/20 px-1 py-0.5 text-[7px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
            ROOT
          </span>
        )}
      </div>

      <div className="py-1.5">
        <p className="text-[11.5px] font-bold leading-tight text-white/95 truncate" title={data.label}>
          {data.label}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.07] pt-1 text-[8.5px] font-mono">
        <div className="flex items-center gap-1.5">
          {typeof data.riskScore === "number" ? (
            <span className={`font-semibold ${isHighRisk ? "text-white font-bold" : theme.nodeText}`}>
              RISK {data.riskScore}
            </span>
          ) : (
            <span className="text-white/30">RISK —</span>
          )}

          {typeof data.confidence === "number" && (
            <span className="text-white/40">· {data.confidence}%</span>
          )}
        </div>

        {evidenceCount > 0 && (
          <span className="rounded bg-rose-950/70 border border-rose-500/30 px-1 py-px text-[7px] font-mono font-semibold text-rose-300">
            +{evidenceCount} EVID
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={`!h-2.5 !w-2.5 !-right-1.5 !border !border-[#090a0d] ${theme.handleColor}`}
      />
    </div>
  );
}

const nodeTypes = { investigation: InvestigationNodeCard };

const NODE_WIDTH = 205;
const NODE_HEIGHT = 82;

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
    ranksep: 145,
    nodesep: 75,
    marginx: 30,
    marginy: 30,
    align: "UL",
    ranker: "network-simplex",
  });

  nodes.forEach((node) => {
    const isHighRisk = typeof node.data.riskScore === "number" && node.data.riskScore >= 75;
    const isEvidenceOrEvent = node.data.type === "Evidence" || node.data.type === "Event";
    const width = isHighRisk ? 220 : isEvidenceOrEvent ? 190 : NODE_WIDTH;
    const height = isHighRisk ? 90 : isEvidenceOrEvent ? 76 : NODE_HEIGHT;

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const isHighRisk = typeof node.data.riskScore === "number" && node.data.riskScore >= 75;
    const isEvidenceOrEvent = node.data.type === "Evidence" || node.data.type === "Event";
    const width = isHighRisk ? 220 : isEvidenceOrEvent ? 190 : NODE_WIDTH;
    const height = isHighRisk ? 90 : isEvidenceOrEvent ? 76 : NODE_HEIGHT;

    const nodeWithPosition = dagreGraph.node(node.id) || { x: 0, y: 0 };
    const x = Math.round(nodeWithPosition.x - width / 2);
    const y = Math.round(nodeWithPosition.y - height / 2);

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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [showAllEvidence, setShowAllEvidence] = useState(true);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (onMaximizeChange && isMaximized) {
          onMaximizeChange(false);
        } else if (focusedId) {
          setFocusedId(null);
        } else if (selectedId) {
          setSelectedId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, onMaximizeChange, isMaximized, focusedId, selectedId]);

  const availableRelTypes = useMemo(() => {
    const types = new Map<string, number>();
    for (const edge of graph?.edges || []) {
      const rawType = edge.type || "ASSOCIATED";
      const normalized = rawType.replace(/\s+/g, "_").toUpperCase();
      if (!STRUCTURAL_RELATIONSHIPS.has(normalized) && !STRUCTURAL_RELATIONSHIPS.has(rawType.toUpperCase())) {
        types.set(rawType, (types.get(rawType) || 0) + 1);
      }
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

  const activeFocusTargetId = hoveredNodeId || selectedId || focusedId;

  const activeNeighbors = useMemo(() => {
    if (!activeFocusTargetId || !graph) return null;
    const set = new Set<string>([activeFocusTargetId]);
    for (const edge of graph.edges) {
      if (edge.source === activeFocusTargetId) set.add(edge.target);
      if (edge.target === activeFocusTargetId) set.add(edge.source);
    }
    return set;
  }, [activeFocusTargetId, graph]);

  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (!graph) return { visibleNodes: [], visibleEdges: [] };

    const edgesWithAllowedTypes = graph.edges.filter(
      (edge) => !disabledRelTypes.has(edge.type || "ASSOCIATED")
    );

    const activeNodeIds = new Set<string>();
    if (focusedId) {
      activeNodeIds.add(focusedId);
      for (const edge of edgesWithAllowedTypes) {
        if (edge.source === focusedId) activeNodeIds.add(edge.target);
        if (edge.target === focusedId) activeNodeIds.add(edge.source);
      }
    } else if (showAllEvidence) {
      graph.nodes.forEach((node) => activeNodeIds.add(node.id));
    } else {
      graph.nodes
        .filter((node) => node.type !== "Event" && node.type !== "Evidence")
        .forEach((node) => activeNodeIds.add(node.id));
    }

    const filteredNodes = graph.nodes.filter((node) => activeNodeIds.has(node.id));
    const candidateEdges = edgesWithAllowedTypes.filter(
      (edge) => activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target)
    );

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

      if (seenPairs.has(pairKey1) || seenPairs.has(pairKey2)) continue;
      seenPairs.add(pairKey1);
      if (isMutual) seenPairs.add(pairKey2);

      const isStructural =
        STRUCTURAL_RELATIONSHIPS.has((edge.type || "").replace(/\s+/g, "_").toUpperCase()) ||
        STRUCTURAL_RELATIONSHIPS.has(edge.type?.toUpperCase() || "");

      const isSpecialAnimated = !isStructural && (edge.type === "CALLED" || edge.type === "TRANSFERRED_TO");
      const category = getEdgeCategory(edge.type || "");
      const theme = CATEGORY_THEMES[category];

      const isDirectlyConnectedToActive = Boolean(
        activeFocusTargetId && (edge.source === activeFocusTargetId || edge.target === activeFocusTargetId)
      );
      const isHoveredEdge = hoveredEdgeId === edge.id;
      const isEdgeActive = isDirectlyConnectedToActive || isHoveredEdge;
      const isEdgeDimmed = Boolean(activeFocusTargetId || hoveredEdgeId) && !isEdgeActive;
      const showLabel = !isStructural && (isEdgeActive || isMutual || Boolean(selectedId && isDirectlyConnectedToActive));

      deduplicatedEdges.push({
        id: isMutual ? `bidir-${edge.id}` : edge.id,
        source: edge.source,
        target: edge.target,
        label: showLabel ? (isMutual ? `↔ ${edge.label || edge.type}` : edge.label || edge.type) : undefined,
        type: "smoothstep",
        animated: isSpecialAnimated && !isEdgeDimmed,
        zIndex: isEdgeActive ? 15 : isStructural ? 1 : 5,
        markerStart: isMutual && !isStructural && !isEdgeDimmed
          ? { type: MarkerType.ArrowClosed, color: isEdgeActive ? theme.edgeStrokeActive : theme.edgeArrow }
          : undefined,
        markerEnd: isStructural || isEdgeDimmed
          ? undefined
          : { type: MarkerType.ArrowClosed, color: isEdgeActive ? theme.edgeStrokeActive : theme.edgeArrow },
        labelStyle: isStructural || !showLabel
          ? undefined
          : { fill: isEdgeActive ? "#ffffff" : theme.edgeText, fontSize: 9, fontFamily: "var(--font-geist-mono), monospace", fontWeight: 600 },
        labelBgStyle: isStructural || !showLabel
          ? undefined
          : { fill: theme.edgeBg, fillOpacity: 0.96, stroke: isEdgeActive ? theme.edgeText : "rgba(255,255,255,0.1)", strokeWidth: 1 },
        labelBgPadding: isStructural || !showLabel ? undefined : [5, 2.5],
        style: isStructural
          ? { stroke: isEdgeDimmed ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.22)", strokeWidth: 1.1, strokeDasharray: "4 3" }
          : {
              stroke: isEdgeDimmed ? "rgba(148, 163, 184, 0.1)" : isEdgeActive ? theme.edgeStrokeActive : theme.edgeStroke,
              strokeWidth: isEdgeActive ? 2.2 : isMutual ? 1.8 : 1.4,
              filter: isEdgeActive ? "drop-shadow(0 0 4px rgba(56, 189, 248, 0.4))" : undefined,
            },
      });
    }

    const flowNodes: FlowNode[] = filteredNodes.map((node) => {
      const isHighlighted = activeFocusTargetId === node.id || Boolean(activeNeighbors?.has(node.id));
      const isDimmed = Boolean(activeNeighbors && !activeNeighbors.has(node.id));
      return {
        id: node.id,
        type: "investigation",
        position: { x: 0, y: 0 },
        data: { ...node, isFocused: node.id === focusedId, isHighlighted, isDimmed, evidenceCount: entityEvidenceCounts.get(node.id) || 0 },
      };
    });

    return { visibleNodes: flowNodes, visibleEdges: deduplicatedEdges };
  }, [graph, disabledRelTypes, focusedId, showAllEvidence, entityEvidenceCounts, activeFocusTargetId, activeNeighbors, hoveredEdgeId, selectedId]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return layoutDagreElements(visibleNodes, visibleEdges, "LR");
  }, [visibleNodes, visibleEdges]);

  const selected = graph?.nodes.find((node) => node.id === selectedId) || null;
  const focusedNode = graph?.nodes.find((node) => node.id === focusedId) || null;
  const hasInvestigationData = Boolean(graph?.nodes.some((node) => node.type !== "Case"));

  const heightClass = isEffectiveMaximized ? "h-[680px]" : "h-[540px]";

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
    if (focusedId === node.id) setFocusedId(null);
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
      <div className="relative flex-1 min-w-0 h-full w-full flex flex-col overflow-hidden bg-[#090a0d]">
        <div className="z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] bg-[#0c0d12]/95 px-3 py-2 text-[10px] font-mono backdrop-blur">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShowAllEvidence(!showAllEvidence)}
              className={`flex items-center gap-1 border px-2 py-1 transition-all cursor-pointer ${
                showAllEvidence
                  ? "border-rose-500/50 bg-rose-950/60 text-rose-200"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
              }`}
              title="Toggle global display of all Event & Evidence nodes"
            >
              {showAllEvidence ? <Eye className="h-3 w-3 text-rose-400" /> : <EyeOff className="h-3 w-3 text-white/40" />}
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

          <div className="flex flex-wrap items-center gap-1 overflow-x-auto max-w-full">
            <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase tracking-widest mr-1">
              <Filter className="h-2.5 w-2.5" />
              <span>RELATIONS:</span>
            </div>

            {availableRelTypes.map(([type, count]) => {
              const isDisabled = disabledRelTypes.has(type);
              const category = getEdgeCategory(type);
              const theme = CATEGORY_THEMES[category];
              return (
                <button
                  key={type}
                  onClick={() => toggleRelType(type)}
                  className={`flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[8.5px] transition-all cursor-pointer ${
                    !isDisabled
                      ? `${theme.pillBorder} ${theme.pillBg} ${theme.pillText} font-semibold shadow-sm`
                      : "border-white/[0.06] bg-white/[0.01] text-white/30 hover:border-white/15"
                  }`}
                  title={`${isDisabled ? "Enable" : "Hide"} ${type} relationships`}
                >
                  {!isDisabled ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dotColor} opacity-40`} />
                  )}
                  <span>{type}</span>
                  <span className="opacity-60 font-bold">({count})</span>
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

            {/* Top Maximize / Restore Button */}
            <button
              onClick={handleToggleMaximize}
              className={`flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[8.5px] font-mono font-semibold transition-all cursor-pointer ml-1 ${
                isEffectiveMaximized
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-sm"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:border-cyan-500/40 hover:text-white"
              }`}
              title={isEffectiveMaximized ? "Restore View (ESC)" : "Maximize Canvas"}
            >
              {isEffectiveMaximized ? (
                <>
                  <Minimize2 className="h-2.5 w-2.5 text-cyan-400" />
                  <span>RESTORE</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-2.5 w-2.5 text-cyan-400" />
                  <span>MAXIMIZE</span>
                </>
              )}
            </button>
          </div>
        </div>

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

          <div className="w-full flex-1 h-full min-h-[460px]">
            <ReactFlowProvider>
              <ReactFlow
                nodes={layoutedNodes}
                edges={layoutedEdges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.22, maxZoom: 1.15 }}
                minZoom={0.15}
                maxZoom={2.25}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable
                onNodeClick={handleNodeClick}
                onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
                onNodeMouseLeave={() => setHoveredNodeId(null)}
                onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
                onEdgeMouseLeave={() => setHoveredEdgeId(null)}
                onPaneClick={() => {
                  setSelectedId(null);
                  setFocusedId(null);
                  setHoveredNodeId(null);
                  setHoveredEdgeId(null);
                }}
                proOptions={{ hideAttribution: true }}
                style={{ width: "100%", height: "100%", minHeight: isEffectiveMaximized ? "620px" : "460px" }}
              >
                <Background color="rgba(148, 163, 184, 0.08)" gap={24} size={1} />
                <Controls
                  showInteractive={false}
                  className="!border-white/10 !bg-[#111218] !fill-white/65 [&>button]:!border-white/10 [&>button]:!bg-[#111218] [&>button]:hover:!bg-white/10"
                />
              </ReactFlow>
            </ReactFlowProvider>
          </div>

          {/* Bottom Control Bar: z-40 to always remain clickable */}
          <div className="absolute bottom-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2.5 border border-white/10 bg-[#111218]/90 backdrop-blur px-2.5 py-1 text-[9px] font-mono text-white/50 shadow">
              <span>{visibleNodes.length} NODES ({graph?.nodes.length || 0} TOTAL)</span>
              <span>·</span>
              <span>{visibleEdges.length} EDGES</span>
              <span className="hidden sm:inline text-white/20">|</span>
              <div className="hidden sm:flex items-center gap-2.5 text-[8.5px]">
                <span className="flex items-center gap-1 text-cyan-300 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span> Comms & Social
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span> Financial
                </span>
                <span className="flex items-center gap-1 text-rose-300 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span> Incidents & Evidence
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleMaximize}
              className="pointer-events-auto flex items-center gap-1.5 border border-cyan-500/40 bg-[#111218]/95 px-3 py-1.5 text-[10px] font-mono font-semibold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 hover:text-white transition-all shadow-lg backdrop-blur cursor-pointer"
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

      {!compact && (
        <aside
          className={
            isFullscreen
              ? selected
                ? "absolute top-14 right-4 bottom-16 z-30 w-80 overflow-y-auto border border-white/20 bg-[#0c0d12]/95 backdrop-blur-md shadow-2xl p-4 rounded"
                : "hidden"
              : "w-full xl:w-80 shrink-0 h-full overflow-y-auto border-t xl:border-t-0 xl:border-l border-white/[0.1] bg-[#0c0d12] p-4"
          }
          style={{ height: isFullscreen ? "auto" : "100%" }}
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-2 mb-3">
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase font-semibold">
              FORENSIC DETAILS
            </span>
            {selected && (
              <button
                onClick={() => setSelectedId(null)}
                className="text-white/35 hover:text-white cursor-pointer"
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
                  <p
                    className={`mt-1 text-sm font-bold ${
                      selected.riskScore && selected.riskScore >= 75 ? "text-white" : "text-cyan-300"
                    }`}
                  >
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
