"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FolderOpen,
  Search,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Priority, CaseStatus, CaseSummary } from "./data";

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
  const [casesList, setCasesList] = useState<CaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CaseStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchCases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.cases)) {
          setCasesList(data.cases);
        }
      } else {
        setError("Failed to fetch cases from database.");
      }
    } catch (err) {
      console.warn("Could not fetch cases from API:", err);
      setError("Network or server connection error.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filtered = casesList.filter((c) => {
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
            {casesList.length} total cases ·{" "}
            {casesList.filter((c) => c.status === "ACTIVE").length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCases}
            disabled={isLoading}
            className="p-1.5 border border-white/10 text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="Refresh cases"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <Link
            href="/dashboard/data-sources"
            className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 hover:bg-cyan-950/50 transition-colors"
          >
            <PlusCircle className="w-3 h-3" />
            INGEST NEW FIR / REPORT
          </Link>
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

      {/* Loading Skeleton */}
      {isLoading && casesList.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border border-white/[0.07] bg-[#0a0b10] p-4 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-white/10 w-24 rounded" />
                <div className="h-4 bg-white/10 w-16 rounded" />
              </div>
              <div className="h-5 bg-white/10 w-3/4 rounded" />
              <div className="h-3 bg-white/10 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="border border-red-500/30 bg-red-950/20 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-red-400 font-mono text-[11px]">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCases}
            className="text-[10px] font-mono text-cyan-400 underline uppercase"
          >
            Retry Fetching Cases
          </button>
        </div>
      )}

      {/* Case cards */}
      {!isLoading && filtered.length === 0 ? (
        <div className="border border-white/[0.08] p-12 text-center space-y-3">
          <p className="text-white/30 font-mono text-[11px] tracking-widest uppercase">
            No active case files found
          </p>
          <p className="text-[10px] font-mono text-white/20 max-w-sm mx-auto">
            Ingest an FIR, CDR record, or surveillance dossier under Data Sources to automatically construct new case files.
          </p>
          <Link
            href="/dashboard/data-sources"
            className="inline-block px-4 py-2 border border-white/10 text-cyan-400 font-mono text-[10px] hover:bg-white/[0.04] transition-colors"
          >
            Go to Data Sources →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/cases/${c.id}`}
              className="block group"
            >
              <div className="relative border border-white/[0.07] bg-[#0a0b10] p-4 hover:border-white/20 hover:bg-white/[0.015] transition-all h-full flex flex-col justify-between">
                {/* Corner marks */}
                <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t border-l border-white/30 pointer-events-none" />
                <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b border-r border-white/30 pointer-events-none" />

                <div>
                  {/* Card top row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-white/50 group-hover:text-white/70">
                        {c.id}
                      </span>
                      <span
                        className={`text-[9px] font-mono border px-1.5 py-px ${priorityColors[c.priority] || priorityColors.MEDIUM}`}
                      >
                        {c.priority}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono border px-2 py-0.5 ${statusColors[c.status] || statusColors.ACTIVE}`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Case name */}
                  <h2 className="text-[13px] font-semibold text-white group-hover:text-white/90 leading-snug mb-1.5">
                    {c.name}
                  </h2>

                  {/* Description */}
                  <p className="text-[11px] font-mono text-white/40 leading-relaxed line-clamp-2 mb-3">
                    {c.description}
                  </p>
                </div>

                {/* Card metadata footer */}
                <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-mono text-white/30">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-white/40">
                      <Users className="w-3 h-3 text-white/30" />
                      {c.entities} entities
                    </span>
                    <span className="flex items-center gap-1 text-white/40">
                      <TrendingUp className="w-3 h-3 text-white/30" />
                      {c.networks} networks
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white/20" />
                    <span>{c.updated}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
