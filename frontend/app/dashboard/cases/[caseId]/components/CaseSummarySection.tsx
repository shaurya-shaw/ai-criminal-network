import React from "react";
import { Users, Link2, FileText, ShieldAlert } from "lucide-react";
import type { CaseDetail } from "../../data";
import SectionHeading from "./SectionHeading";

interface CaseSummarySectionProps {
  caseData: CaseDetail;
  onNavigateToAI: () => void;
}

export default function CaseSummarySection({
  caseData,
  onNavigateToAI,
}: CaseSummarySectionProps) {
  return (
    <section id="summary" className="scroll-mt-24 space-y-4">
      <SectionHeading label="Case Summary" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "ENTITIES",
            value: caseData.entityCount,
            icon: Users,
            color: "text-emerald-400",
          },
          {
            label: "RELATIONSHIPS",
            value: caseData.relationshipCount,
            icon: Link2,
            color: "text-cyan-400",
          },
          {
            label: "EVIDENCE ITEMS",
            value: caseData.evidenceCount,
            icon: FileText,
            color: "text-blue-400",
          },
          {
            label: "ACTIVE ALERTS",
            value: caseData.alertCount,
            icon: ShieldAlert,
            color: "text-amber-400",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative border border-white/[0.1] bg-[#0c0d12]/80 p-4"
            >
              <div className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t border-l border-white/35" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b border-r border-white/35" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono tracking-widest text-white/35 uppercase">
                  {card.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
              <div className={`text-2xl font-bold tabular-nums ${card.color}`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Brief + metadata + AI assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Brief + metadata */}
        <div className="lg:col-span-8 border border-white/[0.1] bg-[#0c0d12]/80 p-5 relative">
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-white/40" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-white/40" />
          <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-3">
            Case Brief
          </h3>
          <p className="text-[12px] font-mono text-white/60 leading-relaxed mb-5">
            {caseData.brief}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 border-t border-white/[0.07] pt-4">
            {[
              { label: "JURISDICTION", value: caseData.jurisdiction },
              { label: "CLASSIFICATION", value: caseData.classification },
              {
                label: "TEAM SIZE",
                value: `${caseData.team.length} PERSONNEL`,
              },
              { label: "ASSIGNED TEAM", value: caseData.team.join(", ") },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono tracking-widest text-white/25 uppercase">
                  {row.label}
                </span>
                <span className="text-[11px] font-mono text-white/60">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assessment panel */}
        <div className="lg:col-span-4 border border-cyan-500/25 bg-cyan-950/10 p-5 relative">
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-cyan-400/60" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-cyan-400/60" />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase">
              AI Assessment
            </span>
          </div>
          <p className="text-[11px] font-mono text-white/65 leading-relaxed mb-4">
            {caseData.aiAssessment.finding}
          </p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
              {caseData.aiAssessment.category}
            </span>
            <span className="text-[11px] font-mono font-bold text-cyan-400">
              {caseData.aiAssessment.confidence}% CONFIDENCE
            </span>
          </div>
          {/* Confidence bar */}
          <div className="w-full h-1 bg-white/10 mb-4">
            <div
              className="h-1 bg-cyan-400 transition-all"
              style={{ width: `${caseData.aiAssessment.confidence}%` }}
            />
          </div>
          <button
            onClick={onNavigateToAI}
            className="text-[10px] font-mono text-cyan-400/70 hover:text-cyan-400 transition-colors"
          >
            View in AI Investigator →
          </button>
        </div>
      </div>
    </section>
  );
}
