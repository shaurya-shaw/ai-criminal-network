"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
  FolderOpen,
  Users,
  Network,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  AlertTriangle,
  Wifi,
  DollarSign,
  RefreshCw,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";
import TerminalCard from "./components/TerminalCard";
import Link from "next/link";
import type { OverviewTelemetry, Priority, AlertSeverity } from "@/lib/api/types";

const priorityColors: Record<Priority, string> = {
  HIGH: "text-red-400 border-red-500/30 bg-red-950/40",
  MEDIUM: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  LOW: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
};

const severityDotColors: Record<AlertSeverity, string> = {
  CRITICAL: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]",
  WARNING: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  INFO: "bg-cyan-400",
};

const borderSeverityColors: Record<string, string> = {
  emerald: "border-emerald-400",
  amber: "border-amber-400",
  cyan: "border-cyan-400",
  red: "border-red-400",
};

export default function DashboardOverview() {
  const { user, isLoaded } = useUser();
  const [telemetry, setTelemetry] = useState<OverviewTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";

  const fetchOverview = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const res = await fetch("/api/overview");
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      } else {
        setError("Failed to load telemetry from database.");
      }
    } catch (err) {
      console.warn("Could not fetch overview telemetry:", err);
      setError("Network or server connection error.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const statCards = [
    {
      label: "ACTIVE CASES",
      value: telemetry?.stats?.activeCases?.value ?? 0,
      delta: telemetry?.stats?.activeCases?.delta || "0 active cases",
      icon: FolderOpen,
      color: "text-emerald-400",
    },
    {
      label: "TOTAL ENTITIES",
      value: telemetry?.stats?.totalEntities?.value?.toLocaleString() ?? 0,
      delta: telemetry?.stats?.totalEntities?.delta || "0 identified",
      icon: Users,
      color: "text-cyan-400",
    },
    {
      label: "NETWORKS",
      value: telemetry?.stats?.networks?.value ?? 0,
      delta: telemetry?.stats?.networks?.delta || "0 mapped",
      icon: Network,
      color: "text-purple-400",
    },
    {
      label: "ALERTS",
      value: telemetry?.stats?.alerts?.value ?? 0,
      delta: telemetry?.stats?.alerts?.delta || "0 unread",
      icon: ShieldAlert,
      color: (telemetry?.stats?.alerts?.value || 0) > 0 ? "text-amber-400" : "text-white/40",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Welcome header & refresh trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] tracking-widest text-emerald-400 uppercase font-bold">
              SYSTEM ONLINE // LIVE TELEMETRY
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            {greeting},{" "}
            {isLoaded
              ? user?.firstName?.toUpperCase() || "INVESTIGATOR"
              : "INVESTIGATOR"}
          </h1>
          <p className="text-[11px] text-white/40">
            Real-time intelligence aggregation across active case files, documents, and threat alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOverview(true)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white/70 hover:text-white text-[11px] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh overview telemetry"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
            />
            <span>REFRESH</span>
          </button>

          <Link
            href="/dashboard/data-sources"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>INGEST DATA</span>
          </Link>
        </div>
      </div>

      {/* Error Notice if any */}
      {error && (
        <div className="p-3 border border-red-500/30 bg-red-950/20 text-red-400 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchOverview(true)}
            className="underline text-[10px] hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative border border-white/[0.1] bg-[#0c0d12]/80 p-4 hover:border-white/20 transition-colors"
            >
              {/* corner marks */}
              <div className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t border-l border-white/40 pointer-events-none" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b border-r border-white/40 pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] tracking-widest text-white/40 uppercase font-semibold">
                  {card.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {isLoading ? (
                  <span className="text-white/20 animate-pulse">...</span>
                ) : (
                  card.value
                )}
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-white/40 truncate">
                <ArrowUpRight className="w-3 h-3 text-emerald-400/80 shrink-0" />
                <span className="truncate">{card.delta}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-column: Active Investigations + Priority Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Active Investigations */}
        <div className="lg:col-span-7">
          <TerminalCard
            title="ACTIVE INVESTIGATIONS"
            statusLabel={
              isLoading
                ? "LOADING"
                : `${telemetry?.activeInvestigations?.length || 0} ACTIVE`
            }
            statusColor="emerald"
          >
            <div className="space-y-2.5">
              {isLoading ? (
                <div className="py-12 text-center text-white/30 text-[11px] space-y-2">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin text-emerald-400" />
                  <p>Aggregating active case registries...</p>
                </div>
              ) : telemetry?.activeInvestigations &&
                telemetry.activeInvestigations.length > 0 ? (
                telemetry.activeInvestigations.map((c) => (
                  <Link href={`/dashboard/cases/${c.id}`} key={c.id}>
                    <div className="group border border-white/[0.07] bg-[#0a0b10] p-3.5 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40 font-bold">
                              {c.id}
                            </span>
                            <span
                              className={`text-[9px] border px-1.5 py-px uppercase font-semibold ${
                                priorityColors[c.priority] || priorityColors.HIGH
                              }`}
                            >
                              {c.priority}
                            </span>
                          </div>
                          <div className="text-[12px] font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-white/40">
                            {c.entities} entities indexed · Updated {c.updated}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/80 border border-emerald-500/20 bg-emerald-950/30 px-2 py-0.5 shrink-0 mt-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          {c.status}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center border border-dashed border-white/10 p-6 space-y-2">
                  <FolderOpen className="w-8 h-8 mx-auto text-white/20" />
                  <p className="text-[11px] text-white/40">
                    No active investigations recorded in Supabase.
                  </p>
                  <Link
                    href="/dashboard/data-sources"
                    className="inline-block mt-2 text-[10px] text-emerald-400 hover:underline uppercase"
                  >
                    + Ingest FIR Document to Initialize Case
                  </Link>
                </div>
              )}

              <Link
                href="/dashboard/cases"
                className="block text-center text-[10px] text-white/30 hover:text-white/60 py-2 border border-white/[0.05] hover:border-white/10 transition-colors"
              >
                VIEW ALL CASE WORKSPACES →
              </Link>
            </div>
          </TerminalCard>
        </div>

        {/* Priority Alerts */}
        <div className="lg:col-span-5">
          <TerminalCard
            title="PRIORITY ALERTS"
            statusLabel={
              isLoading
                ? "LOADING"
                : `${telemetry?.priorityAlerts?.length || 0} FLAGGED`
            }
            statusColor="amber"
          >
            <div className="space-y-2">
              {isLoading ? (
                <div className="py-12 text-center text-white/30 text-[11px]">
                  Loading threat intelligence alerts...
                </div>
              ) : telemetry?.priorityAlerts &&
                telemetry.priorityAlerts.length > 0 ? (
                telemetry.priorityAlerts.map((alert, i) => {
                  const dotColor =
                    severityDotColors[alert.severity] || severityDotColors.WARNING;
                  return (
                    <Link
                      href={`/dashboard/cases/${alert.caseId || ""}`}
                      key={alert.id || i}
                    >
                      <div className="flex items-start gap-3 p-2.5 border border-white/[0.05] hover:border-white/15 hover:bg-white/[0.02] transition-all cursor-pointer group mb-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`}
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-white/90 group-hover:text-white font-semibold leading-snug truncate">
                              {alert.title}
                            </span>
                            <span className="text-[9px] text-amber-400/80 shrink-0 uppercase border border-amber-500/20 px-1">
                              {alert.severity}
                            </span>
                          </div>
                          {alert.description && (
                            <p className="text-[10px] text-white/40 line-clamp-1">
                              {alert.description}
                            </p>
                          )}
                          <div className="text-[9px] text-white/30 flex items-center gap-2 pt-0.5">
                            <span>{alert.caseId}</span>
                            <span>·</span>
                            <span>{alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-8 text-center border border-dashed border-white/10 p-6 space-y-1 text-[11px] text-white/40">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400/60" />
                  <p>NO ACTIVE THREAT ALERTS FLAGGED</p>
                  <p className="text-[9px] text-white/20">All indexed nodes within normal thresholds.</p>
                </div>
              )}

              <Link
                href="/dashboard/alerts"
                className="block text-center text-[10px] text-white/30 hover:text-white/60 py-2 border border-white/[0.05] hover:border-white/10 transition-colors mt-2"
              >
                VIEW FULL ALERT TRIAGE →
              </Link>
            </div>
          </TerminalCard>
        </div>
      </div>

      {/* Network Activity Stream */}
      <TerminalCard
        title="NETWORK & INVESTIGATION ACTIVITY"
        statusLabel="LIVE STREAM"
        statusColor="cyan"
      >
        <div className="space-y-2">
          {isLoading ? (
            <div className="py-8 text-center text-white/30 text-[11px]">
              Streaming intelligence log...
            </div>
          ) : telemetry?.recentActivity &&
            telemetry.recentActivity.length > 0 ? (
            telemetry.recentActivity.map((entry, i) => {
              const borderClass =
                borderSeverityColors[entry.severityColor] || "border-cyan-400";
              return (
                <div
                  key={entry.id || i}
                  className={`flex items-start gap-3 p-2.5 border-l-2 ${borderClass} bg-white/[0.015] hover:bg-white/[0.03] transition-colors pl-3`}
                >
                  <span className="text-[10px] text-white/35 shrink-0 tabular-nums w-14 font-mono">
                    {entry.time}
                  </span>
                  <span className="text-[11px] text-white/70 font-mono leading-relaxed">
                    {entry.label}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-white/30 text-[11px]">
              Intelligence timeline listening for document and network updates.
            </div>
          )}
        </div>
      </TerminalCard>

      {/* Bottom status bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[9px] text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3 gap-2">
        <span>SESSION ACTIVE // FORENSIC INTELLIGENCE ENGINE</span>
        <span>SUPABASE POSTGRES · NEO4J AURA GRAPH SYNCHRONIZED</span>
      </div>
    </div>
  );
}
