import React from "react";
import { Network } from "lucide-react";
import type { CaseDetail } from "../../data";
import SectionHeading from "./SectionHeading";
import { entityTypeIcons, entityTypeColors, riskScoreColor } from "./constants";

interface CaseNetworkGraphSectionProps {
  caseData: CaseDetail;
}

export default function CaseNetworkGraphSection({
  caseData,
}: CaseNetworkGraphSectionProps) {
  return (
    <section id="graph" className="scroll-mt-24 space-y-4">
      <SectionHeading label="Network Graph" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Graph placeholder */}
        <div className="lg:col-span-8 border border-white/[0.1] bg-[#0c0d12]/80 relative min-h-[380px] flex flex-col">
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-white/40" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t border-r border-white/40" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b border-l border-white/40" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-white/40" />

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Entity Graph Visualizer
            </span>
            <span className="text-[9px] font-mono text-cyan-400/70 border border-cyan-500/20 bg-cyan-950/20 px-2 py-0.5">
              3D FORCE ENGINE
            </span>
          </div>

          {/* Graph body */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
            <div className="relative">
              <div className="p-4 bg-white/[0.04] border border-white/10">
                <Network className="w-10 h-10 text-cyan-400/60 animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-emerald-400/80 animate-ping" />
              <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-ping [animation-delay:0.5s]" />
            </div>
            <div className="text-center space-y-1.5">
              <div className="text-sm font-semibold text-white">
                NEO4J GRAPH ENGINE READY
              </div>
              {caseData.networks.map((net) => (
                <div key={net.id} className="text-[11px] text-white/40 font-mono">
                  {net.name} · {net.nodes} nodes · {net.edges} edges
                </div>
              ))}
              <p className="text-[10px] text-white/20 font-mono mt-2">
                Graph visualization will render here via Neo4j integration
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between px-5 py-3 border-t border-white/[0.06] text-[9px] font-mono text-white/20">
            <span>CANVAS: MOUNTED</span>
            <span>GPU ACCELERATION: ACTIVE</span>
            <span>NODES: {caseData.entityCount}</span>
          </div>
        </div>

        {/* Entity list sidebar */}
        <div className="lg:col-span-4 border border-white/[0.1] bg-[#0c0d12]/80 relative">
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-white/40" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-white/40" />

          <div className="px-4 py-3 border-b border-white/[0.07]">
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Key Nodes
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {caseData.entities.map((entity) => {
              const Icon = entityTypeIcons[entity.type];
              return (
                <div
                  key={entity.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${entityTypeColors[entity.type]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white truncate">
                      {entity.name}
                    </div>
                    {entity.alias && (
                      <div className="text-[10px] text-white/30 font-mono">
                        aka {entity.alias}
                      </div>
                    )}
                    <div className="text-[10px] text-white/25 font-mono">
                      {entity.id}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold tabular-nums shrink-0 ${riskScoreColor(entity.riskScore)}`}
                  >
                    {entity.riskScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
