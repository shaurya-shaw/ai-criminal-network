"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Search,
  Check,
} from "lucide-react";
import Link from "next/link";
import TerminalCard from "../components/TerminalCard";
import type { AlertSeverity, AlertStatus, GlobalAlert } from "@/lib/api/types";

type SeverityFilter = AlertSeverity | "ALL";
type StatusFilter = AlertStatus | "ALL";

const severityColors: Record<
  AlertSeverity,
  { border: string; badge: string; dot: string; text: string }
> = {
  CRITICAL: {
    border: "border-l-red-500",
    badge: "text-red-400 border-red-500/30 bg-red-950/40",
    dot: "bg-red-400",
    text: "text-red-400",
  },
  WARNING: {
    border: "border-l-amber-500",
    badge: "text-amber-400 border-amber-500/30 bg-amber-950/40",
    dot: "bg-amber-400",
    text: "text-amber-400",
  },
  INFO: {
    border: "border-l-cyan-500",
    badge: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
    dot: "bg-cyan-400",
    text: "text-cyan-400",
  },
};

const statusIcons: Record<
  AlertStatus,
  { icon: React.ElementType; color: string; label: string }
> = {
  NEW: { icon: ShieldAlert, color: "text-red-400", label: "NEW" },
  ACKNOWLEDGED: { icon: Eye, color: "text-amber-400", label: "ACKNOWLEDGED" },
  RESOLVED: { icon: CheckCircle2, color: "text-emerald-400", label: "RESOLVED" },
};

const severityTabs: SeverityFilter[] = ["ALL", "CRITICAL", "WARNING", "INFO"];
const statusTabs: StatusFilter[] = ["ALL", "NEW", "ACKNOWLEDGED", "RESOLVED"];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
          setNewCount(data.newCount || 0);
          setCriticalCount(data.criticalCount || 0);
        }
      } else {
        setError("Failed to fetch alerts from database.");
      }
    } catch (err) {
      console.warn("Could not fetch alerts from API:", err);
      setError("Network or server connection error.");
    } finally {
      setIsLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleUpdateStatus = async (alertId: string, newStatus: AlertStatus) => {
    try {
      setUpdatingId(alertId);
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Optimistic UI update
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
        );
        if (newStatus === "RESOLVED" || newStatus === "ACKNOWLEDGED") {
          setNewCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Failed to update alert status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.caseId.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Threat Alerts
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Threat & Anomaly Feed
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {alerts.length} total alerts · {newCount} new action items · {criticalCount} critical threats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            disabled={isLoading}
            className="p-1.5 border border-white/10 text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <Link
            href="/dashboard/data-sources"
            className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 hover:bg-cyan-950/50 transition-colors"
          >
            <PlusCircle className="w-3 h-3" />
            INGEST INTELLIGENCE
          </Link>
        </div>
      </div>

      {/* Filter tabs & Search */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity tabs */}
          <div className="flex items-center border border-white/[0.08] bg-[#0c0d12]">
            {severityTabs.map((t) => (
              <button
                key={t}
                onClick={() => setSeverityFilter(t)}
                className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border-r border-white/[0.06] last:border-r-0 ${
                  severityFilter === t
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status tabs */}
          <div className="flex items-center border border-white/[0.08] bg-[#0c0d12]">
            {statusTabs.map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border-r border-white/[0.06] last:border-r-0 ${
                  statusFilter === st
                    ? "bg-white/[0.08] text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-mono w-full lg:max-w-xs">
          <Search className="w-3 h-3 shrink-0" />
          <input
            type="text"
            placeholder="Search alerts, cases, threats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white/70 placeholder:text-white/25 w-full text-[11px] font-mono"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="border border-red-500/30 bg-red-950/20 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-red-400 font-mono text-[11px]">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAlerts}
            className="text-[10px] font-mono text-cyan-400 underline uppercase"
          >
            Retry Fetching Alerts
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && alerts.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border border-white/[0.07] bg-[#0a0b10] p-4 space-y-2 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-white/10 w-32 rounded" />
                <div className="h-4 bg-white/10 w-20 rounded" />
              </div>
              <div className="h-4 bg-white/10 w-3/4 rounded" />
              <div className="h-3 bg-white/10 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Alerts feed list */}
      {!isLoading && filteredAlerts.length === 0 ? (
        <div className="border border-white/[0.08] p-12 text-center space-y-3">
          <p className="text-white/30 font-mono text-[11px] tracking-widest uppercase">
            No threat alerts recorded
          </p>
          <p className="text-[10px] font-mono text-white/20 max-w-sm mx-auto">
            When you ingest FIRs, CDR communications, and surveillance memos in Data Sources, AI threat detection will automatically identify high-risk anomalies and raise active alerts here.
          </p>
          <Link
            href="/dashboard/data-sources"
            className="inline-block px-4 py-2 border border-white/10 text-cyan-400 font-mono text-[10px] hover:bg-white/[0.04] transition-colors"
          >
            Go to Data Sources →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((a) => {
            const sev = severityColors[a.severity] || severityColors.WARNING;
            const stat = statusIcons[a.status] || statusIcons.NEW;
            const StatusIcon = stat.icon;

            return (
              <div
                key={a.id}
                className={`relative border border-white/[0.08] bg-[#0c0d12] p-4 border-l-4 ${sev.border} hover:border-white/20 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-white/50">{a.id}</span>
                      <span className={`text-[9px] font-mono border px-1.5 py-px ${sev.badge}`}>
                        {a.severity}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <StatusIcon className={`w-3 h-3 ${stat.color}`} />
                        <span className={stat.color}>{stat.label}</span>
                      </div>
                      <Link
                        href={`/dashboard/cases/${a.caseId}`}
                        className="text-[9px] font-mono text-cyan-400/80 hover:text-cyan-300 border border-cyan-500/20 bg-cyan-950/20 px-1.5 py-px transition-colors"
                      >
                        {a.caseId}
                      </Link>
                    </div>

                    {/* Title */}
                    <h3 className="text-[13px] font-semibold text-white leading-snug">
                      {a.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] font-mono text-white/50 leading-relaxed">
                      {a.description}
                    </p>

                    {/* Timestamp footer */}
                    <div className="flex items-center gap-1 pt-1 text-[10px] font-mono text-white/30">
                      <Clock className="w-3 h-3 text-white/20" />
                      <span>{a.timestamp}</span>
                    </div>
                  </div>

                  {/* Triage Action Buttons */}
                  <div className="flex items-center sm:flex-col gap-1.5 shrink-0 pt-2 sm:pt-0">
                    {a.status === "NEW" && (
                      <button
                        onClick={() => handleUpdateStatus(a.id, "ACKNOWLEDGED")}
                        disabled={updatingId === a.id}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono border border-amber-500/30 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-colors disabled:opacity-50"
                        title="Acknowledge alert"
                      >
                        <Eye className="w-3 h-3" />
                        Acknowledge
                      </button>
                    )}
                    {a.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleUpdateStatus(a.id, "RESOLVED")}
                        disabled={updatingId === a.id}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono border border-emerald-500/30 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 transition-colors disabled:opacity-50"
                        title="Mark as resolved"
                      >
                        <Check className="w-3 h-3" />
                        Resolve
                      </button>
                    )}
                    {a.status === "RESOLVED" && (
                      <button
                        onClick={() => handleUpdateStatus(a.id, "NEW")}
                        disabled={updatingId === a.id}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                        title="Re-open alert"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
