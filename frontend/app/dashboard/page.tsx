"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import {
  FolderOpen,
  Users,
  Network,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertTriangle,
  Wifi,
  DollarSign,
} from "lucide-react";
import TerminalCard from "./components/TerminalCard";
import Link from "next/link";

const statCards = [
  {
    label: "ACTIVE CASES",
    value: "12",
    delta: "+2 this week",
    deltaUp: true,
    icon: FolderOpen,
  },
  {
    label: "TOTAL ENTITIES",
    value: "1,284",
    delta: "+47 identified",
    deltaUp: true,
    icon: Users,
  },
  {
    label: "NETWORKS",
    value: "43",
    delta: "7 cross-border",
    deltaUp: null,
    icon: Network,
  },
  {
    label: "ALERTS",
    value: "17",
    delta: "3 critical",
    deltaUp: false,
    icon: ShieldAlert,
  },
];

const activeCases = [
  {
    id: "CASE-0091",
    name: "Operation Black Web",
    entities: 43,
    priority: "HIGH" as const,
    status: "ACTIVE",
    updated: "2h ago",
  },
  {
    id: "CASE-0092",
    name: "Financial Investigation",
    entities: 18,
    priority: "MEDIUM" as const,
    status: "ACTIVE",
    updated: "5h ago",
  },
  {
    id: "CASE-0088",
    name: "Narco Supply Route",
    entities: 76,
    priority: "HIGH" as const,
    status: "ACTIVE",
    updated: "12h ago",
  },
];

const priorityAlerts = [
  {
    label: "Network anomaly detected",
    color: "bg-red-400",
    time: "14 min ago",
    icon: Wifi,
  },
  {
    label: "New connection established",
    color: "bg-amber-400",
    time: "1h ago",
    icon: Activity,
  },
  {
    label: "Financial spike – CASE-0092",
    color: "bg-amber-400",
    time: "2h ago",
    icon: DollarSign,
  },
  {
    label: "Unidentified entity flagged",
    color: "bg-cyan-400",
    time: "3h ago",
    icon: AlertTriangle,
  },
];

const priorityColors: Record<string, string> = {
  HIGH: "text-red-400 border-red-500/30 bg-red-950/40",
  MEDIUM: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  LOW: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
};

export default function DashboardOverview() {
  const { user, isLoaded } = useUser();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="space-y-1">
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
          {greeting},{" "}
          {isLoaded
            ? user?.firstName?.toUpperCase() || "INVESTIGATOR"
            : "INVESTIGATOR"}
        </h1>
        <p className="text-[11px] text-white/40 font-mono">
          Here&apos;s what&apos;s happening across your investigations.
        </p>
      </div>

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
                <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">
                  {card.label}
                </span>
                <Icon className="w-3.5 h-3.5 text-white/30" />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {card.value}
              </div>
              <div
                className={`flex items-center gap-1 mt-1.5 text-[10px] font-mono ${
                  card.deltaUp === true
                    ? "text-emerald-400"
                    : card.deltaUp === false
                    ? "text-red-400"
                    : "text-white/40"
                }`}
              >
                {card.deltaUp === true && <ArrowUpRight className="w-3 h-3" />}
                {card.deltaUp === false && (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {card.delta}
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
            statusLabel="LIVE"
            statusColor="emerald"
          >
            <div className="space-y-3">
              {activeCases.map((c) => (
                <Link href="/dashboard/cases" key={c.id}>
                  <div className="group border border-white/[0.07] bg-[#0a0b10] p-3.5 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-white/40">
                            {c.id}
                          </span>
                          <span
                            className={`text-[9px] font-mono border px-1.5 py-px ${priorityColors[c.priority]}`}
                          >
                            {c.priority}
                          </span>
                        </div>
                        <div className="text-[13px] font-semibold text-white group-hover:text-white/90">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-white/40 mt-1 font-mono">
                          {c.entities} entities · updated {c.updated}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400/80 border border-emerald-500/20 bg-emerald-950/30 px-2 py-0.5 shrink-0 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        {c.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              <Link
                href="/dashboard/cases"
                className="block text-center text-[10px] font-mono text-white/30 hover:text-white/60 py-2 border border-white/[0.05] hover:border-white/10 transition-colors"
              >
                VIEW ALL CASES →
              </Link>
            </div>
          </TerminalCard>
        </div>

        {/* Priority Alerts */}
        <div className="lg:col-span-5">
          <TerminalCard
            title="PRIORITY ALERTS"
            statusLabel="17 UNREAD"
            statusColor="amber"
          >
            <div className="space-y-2">
              {priorityAlerts.map((alert, i) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-2.5 border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.02] transition-all cursor-pointer group"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${alert.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-white/80 group-hover:text-white leading-snug">
                        {alert.label}
                      </div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">
                        {alert.time}
                      </div>
                    </div>
                    <Icon className="w-3 h-3 text-white/20 group-hover:text-white/40 shrink-0 mt-0.5" />
                  </div>
                );
              })}

              <Link
                href="/dashboard/alerts"
                className="block text-center text-[10px] font-mono text-white/30 hover:text-white/60 py-2 border border-white/[0.05] hover:border-white/10 transition-colors mt-2"
              >
                VIEW ALL ALERTS →
              </Link>
            </div>
          </TerminalCard>
        </div>
      </div>

      {/* Network Activity */}
      <TerminalCard
        title="NETWORK ACTIVITY"
        statusLabel="STREAMING"
        statusColor="cyan"
      >
        <div className="space-y-2">
          {/* Simulated activity timeline bars */}
          {[
            { time: "14:02", label: "CASE-0091 // 3 new edges detected in cluster B", color: "border-emerald-400" },
            { time: "13:47", label: "CASE-0092 // Financial node linked to offshore account", color: "border-amber-400" },
            { time: "13:21", label: "CASE-0088 // Supply route node updated – 2 new contacts", color: "border-amber-400" },
            { time: "12:58", label: "SYSTEM // Cross-case entity match: E-1482 ↔ E-0774", color: "border-cyan-400" },
            { time: "12:33", label: "CASE-0091 // High-risk entity flagged for manual review", color: "border-red-400" },
          ].map((entry, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-2.5 border-l-2 ${entry.color} bg-white/[0.015] pl-3`}
            >
              <span className="text-[10px] font-mono text-white/30 shrink-0 tabular-nums w-11">
                {entry.time}
              </span>
              <span className="text-[11px] font-mono text-white/60">
                {entry.label}
              </span>
            </div>
          ))}
        </div>
      </TerminalCard>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        <span>SESSION ACTIVE // FORENSIC ENGINE v2.1.0</span>
        <span>RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY</span>
      </div>
    </div>
  );
}
