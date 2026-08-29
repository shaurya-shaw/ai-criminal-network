"use client";

import React from "react";
import { Database, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import TerminalCard from "../components/TerminalCard";

const sources = [
  { id: "DS-001", name: "CDRS Feed", type: "Telecommunications", status: "SYNCED", latency: "38ms", records: "2.4M", lastSync: "2 min ago" },
  { id: "DS-002", name: "Financial Transaction Log", type: "Banking", status: "SYNCED", latency: "55ms", records: "840K", lastSync: "5 min ago" },
  { id: "DS-003", name: "Surveillance CCTV Index", type: "Physical Surveillance", status: "SYNCED", latency: "112ms", records: "91K", lastSync: "12 min ago" },
  { id: "DS-004", name: "FIR Database", type: "Law Enforcement", status: "SYNCED", latency: "29ms", records: "184K", lastSync: "1 min ago" },
  { id: "DS-005", name: "Social Media Harvest", type: "OSINT", status: "PARTIAL", latency: "—", records: "3.1M", lastSync: "18 min ago" },
  { id: "DS-006", name: "Customs & Immigration", type: "Border Control", status: "SYNCED", latency: "76ms", records: "520K", lastSync: "8 min ago" },
];

const statusIcon = (status: string) => {
  if (status === "SYNCED") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (status === "PARTIAL") return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  return <XCircle className="w-3.5 h-3.5 text-red-400" />;
};

const statusColor = (status: string) =>
  status === "SYNCED"
    ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/30"
    : status === "PARTIAL"
    ? "text-amber-400 border-amber-500/30 bg-amber-950/30"
    : "text-red-400 border-red-500/30 bg-red-950/30";

export default function DataSourcesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Intelligence / Data Sources</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">Data Sources</h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">{sources.length} connected sources · avg latency 53ms</p>
        </div>
        <button className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 border border-white/[0.08] hover:border-white/20 hover:text-white/70 px-3 py-1.5 shrink-0 transition-colors">
          <RefreshCw className="w-3 h-3" />
          SYNC ALL
        </button>
      </div>

      <TerminalCard title="CONNECTED SOURCES" statusLabel="6 ACTIVE" statusColor="emerald" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 text-[9px] tracking-widest uppercase">
                <th className="text-left py-3 px-5 font-medium">SOURCE</th>
                <th className="text-left py-3 px-3 font-medium hidden sm:table-cell">TYPE</th>
                <th className="text-left py-3 px-3 font-medium">STATUS</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell">LATENCY</th>
                <th className="text-left py-3 px-3 font-medium hidden lg:table-cell">RECORDS</th>
                <th className="text-left py-3 px-3 pr-5 font-medium">LAST SYNC</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s, i) => (
                <tr key={s.id} className={`border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors ${i % 2 === 1 ? "bg-white/[0.01]" : ""}`}>
                  <td className="py-3 px-5">
                    <div className="text-white font-semibold">{s.name}</div>
                    <div className="text-white/30 text-[10px]">{s.id}</div>
                  </td>
                  <td className="py-3 px-3 text-white/40 hidden sm:table-cell">{s.type}</td>
                  <td className="py-3 px-3">
                    <span className={`flex items-center gap-1.5 text-[9px] border px-2 py-0.5 w-fit ${statusColor(s.status)}`}>
                      {statusIcon(s.status)}
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white/40 hidden md:table-cell">{s.latency}</td>
                  <td className="py-3 px-3 text-white/40 hidden lg:table-cell">{s.records}</td>
                  <td className="py-3 px-3 pr-5 text-white/30">{s.lastSync}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TerminalCard>

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        DATA INGESTION ENGINE // FORENSIC INTELLIGENCE SYSTEM
      </div>
    </div>
  );
}
