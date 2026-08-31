"use client";

import { useCallback, useEffect, useState } from "react";
import { Cpu, Link2, Maximize2, Minimize2, Network, RefreshCw, ShieldAlert, Users } from "lucide-react";
import TerminalCard from "../components/TerminalCard";
import InvestigationGraph from "../components/InvestigationGraph";
import type { CaseSummary } from "@/lib/api/types";
import type { InvestigationGraphData } from "@/lib/neo4j/types";

const priorityStyles: Record<string, string> = {
  HIGH: "border-red-500/30 bg-red-950/40 text-red-300",
  MEDIUM: "border-amber-500/30 bg-amber-950/40 text-amber-300",
  LOW: "border-cyan-500/30 bg-cyan-950/40 text-cyan-300",
};

export default function NetworksPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [graphCounts, setGraphCounts] = useState({ nodes: 0, edges: 0 });
  const [isMaximized, setIsMaximized] = useState(false);

  const loadCases = useCallback(async () => {
    setLoadingCases(true);
    setCaseError(null);
    try {
      const response = await fetch("/api/cases", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load cases.");
      const nextCases = Array.isArray(payload.cases) ? payload.cases : [];
      setCases(nextCases);
      setSelectedCaseId((current) => current && nextCases.some((item: CaseSummary) => item.id === current) ? current : nextCases[0]?.id || null);
    } catch (error) {
      setCaseError(error instanceof Error ? error.message : "Unable to load cases.");
      setCases([]);
      setSelectedCaseId(null);
    } finally {
      setLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const onGraphChange = useCallback((graph: InvestigationGraphData) => {
    setGraphCounts({ nodes: graph.nodes.length, edges: graph.edges.length });
  }, []);
  const selected = cases.find((item) => item.id === selectedCaseId) || null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Network className="h-4 w-4 text-white/40" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              Intelligence / Network Topology
            </span>
          </div>
          <h1 className="text-base font-bold uppercase tracking-tight text-white sm:text-lg">
            Network Topology
          </h1>
          <p className="mt-0.5 text-[11px] font-mono text-white/40">
            {cases.length} active cases · {graphCounts.nodes} live nodes · {graphCounts.edges} live edges
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMaximized && (
            <button
              onClick={() => setIsMaximized(false)}
              className="flex items-center gap-1.5 border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-[10px] font-mono font-bold text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>SHOW CASES PANEL</span>
            </button>
          )}

          <div className="flex shrink-0 items-center gap-1.5 border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-[10px] font-mono text-cyan-400">
            <Cpu className="h-3 w-3 animate-pulse" />
            <span>NEO4J LIVE</span>
          </div>
        </div>
      </div>

      {/* When Maximized: Sleek Case Switcher Bar */}
      {isMaximized && cases.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border border-white/10 bg-[#0c0d12]/90 p-2.5 backdrop-blur font-mono">
          <span className="text-[9px] uppercase tracking-widest text-white/40 pl-1">SELECT CASE:</span>
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCaseId(c.id);
                setGraphCounts({ nodes: 0, edges: 0 });
              }}
              className={`px-2.5 py-1 text-[10px] border transition-all cursor-pointer ${
                selectedCaseId === c.id
                  ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 font-bold"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              <span className="text-white/40 mr-1.5">{c.id}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Graph Visualizer: Expands to full 12 cols when maximized */}
        <div className={isMaximized ? "lg:col-span-12" : "lg:col-span-8"}>
          <TerminalCard
            title={selected ? `${selected.name} // ${selected.id}` : "ENTITY GRAPH VISUALIZER"}
            statusLabel={isMaximized ? "FULL VIEW" : "LIVE GRAPH"}
            statusColor="cyan"
            noPadding
          >
            {selectedCaseId ? (
              <InvestigationGraph
                caseId={selectedCaseId}
                onGraphChange={onGraphChange}
                isMaximized={isMaximized}
                onMaximizeChange={setIsMaximized}
              />
            ) : (
              <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 text-center">
                <Network className="h-8 w-8 text-cyan-400/35" />
                <p className="text-[11px] font-mono text-white/45">SELECT A CASE TO LOAD ITS INVESTIGATION GRAPH</p>
              </div>
            )}
          </TerminalCard>
        </div>

        {/* Side Cases Panel: Completely hidden when maximized */}
        {!isMaximized && (
          <div className="lg:col-span-4">
            <TerminalCard title="CASES" statusLabel={`${cases.length} TOTAL`} statusColor="white">
              {loadingCases ? (
                <div className="flex items-center justify-center py-10 text-[10px] font-mono text-white/40">
                  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin text-cyan-400" />
                  LOADING CASES
                </div>
              ) : null}
              {caseError ? (
                <div className="space-y-3 py-6 text-center">
                  <ShieldAlert className="mx-auto h-5 w-5 text-red-400" />
                  <p className="text-[10px] font-mono text-white/45">{caseError}</p>
                  <button
                    onClick={() => void loadCases()}
                    className="border border-white/10 px-2 py-1 text-[9px] font-mono text-white/60 hover:bg-white/[0.04]"
                  >
                    RETRY
                  </button>
                </div>
              ) : null}
              {!loadingCases && !caseError && cases.length === 0 ? (
                <div className="py-10 text-center text-[10px] font-mono text-white/35">NO CASES AVAILABLE</div>
              ) : null}
              <div className="space-y-2">
                {cases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => {
                      setSelectedCaseId(caseItem.id);
                      setGraphCounts({ nodes: 0, edges: 0 });
                    }}
                    className={`w-full border p-3.5 text-left transition-all ${
                      selectedCaseId === caseItem.id
                        ? "border-cyan-500/30 bg-cyan-950/20"
                        : "border-white/[0.07] hover:border-white/15 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-white/40">{caseItem.id}</span>
                      <span
                        className={`border px-1.5 py-px text-[9px] font-mono ${
                          priorityStyles[caseItem.priority] || priorityStyles.MEDIUM
                        }`}
                      >
                        {caseItem.priority}
                      </span>
                    </div>
                    <p className="mb-2 text-[12px] font-semibold leading-snug text-white">{caseItem.name}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/35">
                      <span className="flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        {caseItem.entities} indexed
                      </span>
                      <span className="flex items-center gap-1">
                        <Link2 className="h-2.5 w-2.5" />
                        {caseItem.networks} graph
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </TerminalCard>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] pt-3 text-[9px] font-mono uppercase tracking-widest text-white/20">
        Network Topology Engine // Supabase JSONB → Neo4j → React Flow
      </div>
    </div>
  );
}
