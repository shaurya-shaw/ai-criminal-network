"use client";

import React, { useState } from "react";
import { FolderOpen, Search, Calendar, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { caseSummaries } from "./data";
import type { Priority, CaseStatus } from "./data";

const statusFilters: (CaseStatus | "ALL")[] = [
  "ALL",
  "ACTIVE",
  "PENDING",
  "CLOSED",
];

const priorityColors: Record<Priority, string> = {
  HIGH: "text-red-400 border-red-500/30 bg-red-950/40",
  MEDIUM: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  LOW: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
};

const statusColors: Record<CaseStatus, string> = {
  ACTIVE: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30",
  PENDING: "text-amber-400 border-amber-500/30 bg-amber-950/30",
  CLOSED: "text-white/40 border-white/10 bg-white/5",
};

export default function CasesPage() {
  const [filter, setFilter] = useState<CaseStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = caseSummaries.filter((c) => {
    const matchesFilter = filter === "ALL" || c.status === filter;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.investigator.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Case Files
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Case Files
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {caseSummaries.length} total cases ·{" "}
            {caseSummaries.filter((c) => c.status === "ACTIVE").length} active
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE SYNC
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center border border-white/[0.08] bg-[#0c0d12]">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border-r border-white/[0.06] last:border-r-0 ${
                filter === f
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-mono flex-1 sm:max-w-xs">
          <Search className="w-3 h-3 shrink-0" />
          <input
            type="text"
            placeholder="Search cases, IDs, agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white/70 placeholder:text-white/25 w-full text-[11px] font-mono"
          />
        </div>
      </div>

      {/* Case cards */}
      {filtered.length === 0 ? (
        <div className="border border-white/[0.08] p-12 text-center">
          <p className="text-white/30 font-mono text-[11px] tracking-widest uppercase">
            No cases found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/cases/${c.id}`}
              className="block"
            >
              <div className="relative border border-white/[0.1] bg-[#0c0d12]/90 p-5 hover:border-white/25 hover:bg-[#0c0d12] transition-all group cursor-pointer h-full">
                {/* Corner marks */}
                <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-white/40 pointer-events-none" />
                <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-white/40 pointer-events-none" />

                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
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
                    <h2 className="text-[13px] font-semibold text-white group-hover:text-white/90 leading-snug">
                      {c.name}
                    </h2>
                  </div>
                  <span
                    className={`text-[9px] font-mono border px-2 py-0.5 shrink-0 ${statusColors[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-white/40 font-mono leading-relaxed mb-4 line-clamp-2">
                  {c.description}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-white/30 border-t border-white/[0.06] pt-3">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    {c.entities} entities
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    {c.networks} networks
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    <Calendar className="w-3 h-3" />
                    {c.updated}
                  </span>
                </div>

                {/* Investigator + open hint */}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[10px] font-mono text-white/25">
                    LEAD: {c.investigator}
                  </div>
                  <div className="text-[9px] font-mono text-white/20 group-hover:text-white/50 transition-colors">
                    VIEW CASE →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        CASE DATABASE // FORENSIC INTELLIGENCE ENGINE // AUTHORIZED ACCESS ONLY
      </div>
    </div>
  );
}
