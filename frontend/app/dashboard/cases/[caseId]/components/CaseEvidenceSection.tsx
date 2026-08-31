import React, { useState } from "react";
import { Clock } from "lucide-react";
import type { CaseDetail, EvidenceType } from "../../data";
import SectionHeading from "./SectionHeading";
import { evidenceTypeConfig } from "./constants";

interface CaseEvidenceSectionProps {
  caseData: CaseDetail;
}

export default function CaseEvidenceSection({
  caseData,
}: CaseEvidenceSectionProps) {
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceType | "ALL">(
    "ALL",
  );

  const evidenceList = caseData.evidence || [];
  const filteredEvidence =
    evidenceFilter === "ALL"
      ? evidenceList
      : evidenceList.filter((e) => e.type === evidenceFilter);

  return (
    <section id="evidence" className="scroll-mt-24 space-y-4">
      <SectionHeading label="Evidence" count={evidenceList.length} />

      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            "ALL",
            "DOCUMENT",
            "FINANCIAL_RECORD",
            "COMMUNICATION",
            "MEDIA",
            "PHYSICAL",
          ] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setEvidenceFilter(f)}
            className={`px-2.5 py-1 text-[9px] font-mono tracking-widest uppercase transition-colors border ${
              evidenceFilter === f
                ? "border-white/20 bg-white/[0.08] text-white"
                : "border-white/[0.06] text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
            }`}
          >
            {f === "FINANCIAL_RECORD" ? "FINANCIAL" : f}
          </button>
        ))}
      </div>

      {/* Evidence cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredEvidence.length === 0 ? (
          <div className="col-span-full border border-white/[0.09] bg-[#0c0d12]/80 p-8 text-center text-white/35 font-mono text-[10px] uppercase tracking-widest">
            No evidence records or document citations found for this filter.
          </div>
        ) : (
          filteredEvidence.map((ev) => {
            const cfg = evidenceTypeConfig[ev.type] || evidenceTypeConfig.DOCUMENT;
            return (
              <div
                key={ev.id}
                className={`relative border border-white/[0.09] border-l-2 ${cfg.borderColor} bg-[#0c0d12]/80 p-4 hover:border-white/15 transition-all`}
              >
                <div className="absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t border-r border-white/35" />
                <div className="absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b border-l border-white/35" />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-white/30">
                        {ev.id}
                      </span>
                      <span
                        className={`text-[9px] font-mono border px-1.5 py-px ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-[13px] font-semibold text-white leading-snug">
                      {ev.title}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-white/40 leading-relaxed mb-3">
                  {ev.description}
                </p>

                {/* Footer */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-white/25 border-t border-white/[0.06] pt-2.5">
                  <span>SOURCE: {ev.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {ev.dateAdded}
                  </span>
                  <div className="flex flex-wrap gap-1 ml-auto">
                    {(ev.linkedEntities || []).map((eid) => (
                      <span
                        key={eid}
                        className="border border-white/10 px-1 py-px text-[9px]"
                      >
                        {eid}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

