import React from "react";
import type { CaseDetail } from "../../data";
import SectionHeading from "./SectionHeading";
import {
  entityTypeIcons,
  entityTypeColors,
  riskScoreColor,
  entityStatusColors,
} from "./constants";

interface CaseEntitiesSectionProps {
  caseData: CaseDetail;
}

export default function CaseEntitiesSection({
  caseData,
}: CaseEntitiesSectionProps) {
  return (
    <section id="entities" className="scroll-mt-24 space-y-4">
      <SectionHeading label="Entities" count={caseData.entityCount} />

      <div className="border border-white/[0.1] bg-[#0c0d12]/80 relative overflow-hidden">
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-white/40" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-white/40" />
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 text-[9px] tracking-widest uppercase">
                <th className="text-left py-3 px-5 font-medium">ID</th>
                <th className="text-left py-3 px-3 font-medium">NAME</th>
                <th className="text-left py-3 px-3 font-medium">TYPE</th>
                <th className="text-left py-3 px-3 font-medium">RISK</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell">
                  LAST SEEN
                </th>
                <th className="text-left py-3 px-3 pr-5 font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {caseData.entities.map((entity, i) => {
                const Icon = entityTypeIcons[entity.type];
                return (
                  <tr
                    key={entity.id}
                    className={`border-b border-white/[0.05] hover:bg-white/[0.025] transition-colors cursor-pointer ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`}
                  >
                    <td className="py-3 px-5 text-white/40">{entity.id}</td>
                    <td className="py-3 px-3">
                      <div className="text-white font-semibold">
                        {entity.name}
                      </div>
                      {entity.alias && (
                        <div className="text-[10px] text-white/30">
                          aka {entity.alias}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`flex items-center gap-1.5 ${entityTypeColors[entity.type]}`}
                      >
                        <Icon className="w-3 h-3" />
                        {entity.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold ${riskScoreColor(entity.riskScore)}`}
                      >
                        {entity.riskScore}
                      </span>
                      <span className="text-white/20">/100</span>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell text-white/30">
                      {entity.lastSeen}
                    </td>
                    <td className="py-3 px-3 pr-5">
                      <span
                        className={`text-[9px] border px-2 py-0.5 ${entityStatusColors[entity.status]}`}
                      >
                        {entity.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
