"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Wifi,
  DollarSign,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import TerminalCard from "../components/TerminalCard";

type Severity = "CRITICAL" | "WARNING" | "INFO";
type AlertStatus = "NEW" | "ACKNOWLEDGED" | "RESOLVED";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  caseId: string;
  timestamp: string;
  icon: React.ElementType;
}

const alerts: Alert[] = [
  {
    id: "ALT-0091",
    title: "Network anomaly detected",
    description:
      "Unusual spike in connection requests from entity E-1482 across 3 nodes in cluster B. Possible lateral movement detected.",
    severity: "CRITICAL",
    status: "NEW",
    caseId: "CASE-0091",
    timestamp: "2026-08-29 13:48 UTC",
    icon: Wifi,
  },
  {
    id: "ALT-0090",
    title: "High-risk entity flagged for review",
    description:
      "Entity E-0774 matched against cross-case correlation engine. Appears in 3 active cases. Manual review required.",
    severity: "CRITICAL",
    status: "NEW",
    caseId: "CASE-0088",
    timestamp: "2026-08-29 13:21 UTC",
    icon: User,
  },
  {
    id: "ALT-0089",
    title: "Financial spike — offshore account",
    description:
      "Account ACC-007742881 logged a ₹4.2CR transaction to an unidentified offshore entity. Flagged for AML review.",
    severity: "WARNING",
    status: "ACKNOWLEDGED",
    caseId: "CASE-0092",
    timestamp: "2026-08-29 12:05 UTC",
    icon: DollarSign,
  },
  {
    id: "ALT-0088",
    title: "New connection established",
    description:
      "Previously unknown entity added a connection to Rajan Mehra (E-0774). Entity ID pending assignment.",
    severity: "WARNING",
    status: "NEW",
    caseId: "CASE-0091",
    timestamp: "2026-08-29 11:44 UTC",
    icon: Activity,
  },
  {
    id: "ALT-0087",
    title: "Cross-case entity match",
    description:
      "Entity E-1482 found to share attributes with E-0774. Automated cross-case linking triggered.",
    severity: "INFO",
    status: "ACKNOWLEDGED",
    caseId: "CASE-0088",
    timestamp: "2026-08-29 10:30 UTC",
    icon: AlertTriangle,
  },
  {
    id: "ALT-0085",
    title: "Data source sync failure",
    description:
      "CDRS feed failed to synchronize for 18 minutes. Partial data gap logged. Auto-recovery initiated.",
    severity: "WARNING",
    status: "RESOLVED",
    caseId: "CASE-0083",
    timestamp: "2026-08-28 22:14 UTC",
    icon: Activity,
  },
  {
    id: "ALT-0082",
    title: "Entity risk score elevated",
    description:
      "Patel Logistics (E-0822) risk score raised from 42 to 55 after new evidence linkage.",
    severity: "INFO",
    status: "RESOLVED",
    caseId: "CASE-0088",
    timestamp: "2026-08-28 18:00 UTC",
    icon: AlertTriangle,
  },
];

type FilterTab = Severity | "ALL";

const severityColors: Record<Severity, { border: string; badge: string; dot: string }> = {
  CRITICAL: {
    border: "border-l-red-400",
    badge: "text-red-400 border-red-500/30 bg-red-950/40",
    dot: "bg-red-400",
  },
  WARNING: {
    border: "border-l-amber-400",
    badge: "text-amber-400 border-amber-500/30 bg-amber-950/40",
    dot: "bg-amber-400",
  },
  INFO: {
    border: "border-l-cyan-400",
    badge: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
    dot: "bg-cyan-400",
  },
};

const statusIcons: Record<AlertStatus, { icon: React.ElementType; color: string }> = {
  NEW: { icon: ShieldAlert, color: "text-red-400" },
  ACKNOWLEDGED: { icon: Eye, color: "text-amber-400" },
  RESOLVED: { icon: CheckCircle2, color: "text-white/30" },
};

const filterTabs: FilterTab[] = ["ALL", "CRITICAL", "WARNING", "INFO"];

export default function AlertsPage() {
  const [filter, setFilter] = useState<FilterTab>("ALL");

  const filtered = alerts.filter(
    (a) => filter === "ALL" || a.severity === filter
  );

  const newCount = alerts.filter((a) => a.status === "NEW").length;
  const critCount = alerts.filter((a) => a.severity === "CRITICAL").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Priority Alerts
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Priority Alerts
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {alerts.length} total · {newCount} unread · {critCount} critical
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 border border-red-500/30 bg-red-950/30 px-3 py-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {newCount} NEW
        </div>
      </div>

      {/* Summary stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {(["CRITICAL", "WARNING", "INFO"] as Severity[]).map((sev) => {
          const count = alerts.filter((a) => a.severity === sev).length;
          const colors = severityColors[sev];
          return (
            <div
              key={sev}
              className={`border border-white/[0.08] bg-[#0c0d12]/60 p-3 border-l-2 ${colors.border} cursor-pointer hover:bg-white/[0.02] transition-colors`}
              onClick={() => setFilter(sev)}
            >
              <div className="text-xl font-bold text-white">{count}</div>
              <div className={`text-[10px] font-mono mt-0.5 ${colors.badge.split(" ")[0]}`}>
                {sev}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center border border-white/[0.08] bg-[#0c0d12] w-fit">
        {filterTabs.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border-r border-white/[0.06] last:border-r-0 ${
              filter === f
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
            }`}
          >
            {f}
            {f !== "ALL" && (
              <span className="ml-1.5 text-white/25">
                ({alerts.filter((a) => a.severity === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert feed */}
      <TerminalCard title="ALERT FEED" statusLabel={`${filtered.length} ALERTS`} statusColor="white">
        <div className="space-y-2">
          {filtered.map((alert) => {
            const colors = severityColors[alert.severity];
            const StatusIcon = statusIcons[alert.status].icon;
            const Icon = alert.icon;

            return (
              <div
                key={alert.id}
                className={`border border-white/[0.07] border-l-2 ${colors.border} bg-[#0a0b10] p-4 hover:border-white/15 transition-all group cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  {/* Severity icon */}
                  <div className="mt-0.5 shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${colors.badge.split(" ")[0]}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-semibold text-white group-hover:text-white/90">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono border px-1.5 py-px ${colors.badge}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusIcon
                          className={`w-3.5 h-3.5 ${statusIcons[alert.status].color}`}
                        />
                        <span className="text-[9px] font-mono text-white/30">
                          {alert.status}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] font-mono text-white/45 leading-relaxed mb-2.5">
                      {alert.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-[10px] font-mono text-white/25">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {alert.timestamp}
                      </span>
                      <span className="text-white/20">·</span>
                      <span>{alert.caseId}</span>
                      <span className="text-white/20">·</span>
                      <span>{alert.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-white/25 font-mono text-[11px] tracking-widest uppercase">
              No alerts in this category
            </div>
          )}
        </div>
      </TerminalCard>

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        ALERT ENGINE // {filtered.length} of {alerts.length} records · FORENSIC INTELLIGENCE SYSTEM
      </div>
    </div>
  );
}
