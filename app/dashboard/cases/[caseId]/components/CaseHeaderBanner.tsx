import React from "react";
import type { CaseDetail } from "../../data";
import { priorityColors, statusColors } from "./constants";

interface CaseHeaderBannerProps {
  caseData: CaseDetail;
}

export default function CaseHeaderBanner({ caseData }: CaseHeaderBannerProps) {
  return (
    <div className="relative border border-white/[0.14] bg-[#0c0d12]/90 p-5 sm:p-7 mb-0">
      <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-white/50 pointer-events-none" />
      <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-white/50 pointer-events-none" />
      <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-white/50 pointer-events-none" />
      <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-white/50 pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="flex-1 min-w-0">
          {/* Case ID + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-mono text-white/40 tracking-widest">
              {caseData.id}
            </span>
            <span
              className={`text-[9px] font-mono border px-2 py-px ${statusColors[caseData.status]}`}
            >
              {caseData.status}
            </span>
            <span
              className={`text-[9px] font-mono border px-2 py-px ${priorityColors[caseData.priority]}`}
            >
              {caseData.priority} PRIORITY
            </span>
            <span className="text-[9px] font-mono text-white/25 border border-white/10 px-2 py-px">
              {caseData.classification}
            </span>
          </div>

          {/* Case name */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            {caseData.name}
          </h1>

          {/* Description */}
          <p className="text-[12px] font-mono text-white/50 max-w-2xl leading-relaxed">
            {caseData.description}
          </p>
        </div>

        {/* Right: metadata */}
        <div className="shrink-0 space-y-2 text-[11px] font-mono">
          {[
            { label: "LEAD", value: caseData.investigator },
            { label: "OPENED", value: caseData.opened },
            { label: "UPDATED", value: caseData.updated },
            { label: "JURISDICTION", value: caseData.jurisdiction },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-white/30 tracking-widest text-[9px] w-20">
                {row.label}
              </span>
              <span className="text-white/70">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
