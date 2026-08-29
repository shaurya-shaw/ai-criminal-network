"use client";

import React, { useState } from "react";
import { Network, Cpu, Globe, ArrowUpRight, Users, Link2 } from "lucide-react";
import TerminalCard from "../components/TerminalCard";

type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface NetworkEntry {
  id: string;
  name: string;
  nodes: number;
  edges: number;
  risk: RiskLevel;
  crossBorder: boolean;
  regions: string[];
  caseId: string;
  lastActivity: string;
}

const networks: NetworkEntry[] = [
  {
    id: "NET-001",
    name: "Black Web Supply Ring",
    nodes: 43,
    edges: 118,
    risk: "CRITICAL",
    crossBorder: true,
    regions: ["MH", "DL", "PB", "RJ"],
    caseId: "CASE-0091",
    lastActivity: "14 min ago",
  },
  {
    id: "NET-002",
    name: "Offshore Finance Cluster",
    nodes: 18,
    edges: 41,
    risk: "HIGH",
    crossBorder: true,
    regions: ["MH", "GJ"],
    caseId: "CASE-0092",
    lastActivity: "2h ago",
  },
  {
    id: "NET-003",
    name: "Punjab Transit Corridor",
    nodes: 76,
    edges: 203,
    risk: "CRITICAL",
    crossBorder: true,
    regions: ["PB", "HR", "UP"],
    caseId: "CASE-0088",
    lastActivity: "12h ago",
  },
  {
    id: "NET-004",
    name: "Mumbai Cyber Syndicate",
    nodes: 29,
    edges: 67,
    risk: "MEDIUM",
    crossBorder: false,
    regions: ["MH"],
    caseId: "CASE-0083",
    lastActivity: "2 days ago",
  },
];

const riskColors: Record<RiskLevel, string> = {
  CRITICAL: "text-red-400 border-red-500/30 bg-red-950/40",
  HIGH: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  MEDIUM: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
  LOW: "text-white/40 border-white/10 bg-white/5",
};

const riskDotColors: Record<RiskLevel, string> = {
  CRITICAL: "bg-red-400",
  HIGH: "bg-amber-400",
  MEDIUM: "bg-cyan-400",
  LOW: "bg-white/40",
};

export default function NetworksPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>("NET-001");

  const selected = networks.find((n) => n.id === selectedNetwork);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Network Topology
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Network Topology
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {networks.length} active networks ·{" "}
            {networks.reduce((a, n) => a + n.nodes, 0)} total nodes ·{" "}
            {networks.reduce((a, n) => a + n.edges, 0)} edges
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 shrink-0">
          <Cpu className="w-3 h-3 animate-pulse" />
          3D ENGINE READY
        </div>
      </div>

      {/* Main layout: graph + network list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Graph visualizer placeholder */}
        <div className="lg:col-span-8">
          <TerminalCard
            title={selected ? `${selected.name} // ${selected.id}` : "ENTITY GRAPH VISUALIZER"}
            statusLabel="GPU ACTIVE"
            statusColor="cyan"
            noPadding
          >
            <div className="min-h-[420px] flex flex-col justify-between px-5 sm:px-6 pb-5 sm:pb-6">
              {/* Graph area */}
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="p-4 bg-white/[0.04] border border-white/10">
                    <Network className="w-10 h-10 text-cyan-400/60 animate-pulse" />
                  </div>
                  {/* Orbiting dots */}
                  <div className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" />
                  <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-ping [animation-delay:0.5s]" />
                </div>

                {selected ? (
                  <div className="text-center space-y-1.5">
                    <div className="text-sm font-semibold text-white">
                      {selected.name}
                    </div>
                    <p className="text-[11px] text-white/40 font-mono max-w-xs text-center">
                      {selected.nodes} nodes · {selected.edges} edges · {selected.regions.join(", ")}
                    </p>
                    <p className="text-[10px] text-white/25 font-mono">
                      Neo4j graph engine will render here. Select a network to visualize.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <div className="text-sm font-semibold text-white">
                      GRAPH TOPOLOGY READY
                    </div>
                    <p className="text-[11px] text-white/40 font-mono max-w-xs text-center">
                      Select a network from the list to visualize its entity relationship graph.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer status bar */}
              <div className="text-[9px] text-white/25 border-t border-white/[0.06] pt-3 flex justify-between font-mono">
                <span>CANVAS: MOUNTED</span>
                <span>GPU ACCELERATION: ACTIVE</span>
                <span>FORCE ENGINE: 3D</span>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Network list */}
        <div className="lg:col-span-4">
          <TerminalCard title="NETWORKS" statusLabel={`${networks.length} TOTAL`} statusColor="white">
            <div className="space-y-2">
              {networks.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net.id)}
                  className={`w-full text-left border p-3.5 transition-all ${
                    selectedNetwork === net.id
                      ? "border-cyan-500/30 bg-cyan-950/20"
                      : "border-white/[0.07] bg-transparent hover:border-white/15 hover:bg-white/[0.02]"
                  }`}
                >
                  {/* ID + risk */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-white/40">
                      {net.id}
                    </span>
                    <span
                      className={`text-[9px] font-mono border px-1.5 py-px flex items-center gap-1 ${riskColors[net.risk]}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${riskDotColors[net.risk]}`} />
                      {net.risk}
                    </span>
                  </div>

                  <div className="text-[12px] font-semibold text-white leading-snug mb-2">
                    {net.name}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-white/35">
                    <span className="flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />
                      {net.nodes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Link2 className="w-2.5 h-2.5" />
                      {net.edges}
                    </span>
                    {net.crossBorder && (
                      <span className="flex items-center gap-1 text-amber-400/70">
                        <Globe className="w-2.5 h-2.5" />
                        CROSS-BORDER
                      </span>
                    )}
                  </div>

                  <div className="text-[9px] font-mono text-white/20 mt-2">
                    {net.caseId} · {net.lastActivity}
                  </div>
                </button>
              ))}
            </div>
          </TerminalCard>
        </div>
      </div>

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        NETWORK TOPOLOGY ENGINE // FORENSIC INTELLIGENCE SYSTEM
      </div>
    </div>
  );
}
