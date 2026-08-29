import React from "react";
import { Clock } from "lucide-react";
import type { CaseDetail } from "../../data";
import SectionHeading from "./SectionHeading";
import {
  alertSeverityColors,
  alertSeverityBadge,
  alertStatusConfig,
} from "./constants";

interface CaseAlertsSectionProps {
  caseData: CaseDetail;
}

export default function CaseAlertsSection({
  caseData,
}: CaseAlertsSectionProps) {
  return (
    <section id="alerts" className="scroll-mt-24 space-y-4">
      <SectionHeading label="Alerts" count={caseData.alertCount} />

      <div className="space-y-2">
        {caseData.alerts.map((alert) => {
          const StatusIcon = alertStatusConfig[alert.status].icon;
          return (
            <div
              key={alert.id}
              className={`border border-white/[0.07] border-l-2 ${alertSeverityColors[alert.severity]} bg-[#0c0d12]/80 p-4 hover:border-white/15 transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-white">
                        {alert.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono border px-1.5 py-px ${alertSeverityBadge[alert.severity]}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusIcon
                        className={`w-3.5 h-3.5 ${alertStatusConfig[alert.status].color}`}
                      />
                      <span className="text-[9px] font-mono text-white/30">
                        {alert.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-white/45 leading-relaxed mb-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {alert.timestamp}
                    </span>
                    <span>{alert.id}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
