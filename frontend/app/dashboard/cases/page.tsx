"use client";

import React, { useState } from "react";
import { FolderOpen, Search, Calendar, Users, TrendingUp } from "lucide-react";
import TerminalCard from "../components/TerminalCard";
import Link from "next/link";

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Status = "ACTIVE" | "CLOSED" | "PENDING";

interface Case {
  id: string;
  name: string;
  status: Status;
  priority: Priority;
  entities: number;
  networks: number;
  investigator: string;
  opened: string;
  updated: string;
  description: string;
}

const cases: Case[] = [
  {
    id: "CASE-0091",
    name: "Operation Black Web",
    status: "ACTIVE",
    priority: "HIGH",
    entities: 43,
    networks: 5,
    investigator: "AGENT SHARMA",
    opened: "2026-07-14",
    updated: "2h ago",
    description:
      "Deep web marketplace network linked to narcotics and weapon distribution across 4 states.",
  },
  {
    id: "CASE-0092",
    name: "Financial Investigation – Offshore",
    status: "ACTIVE",
    priority: "MEDIUM",
    entities: 18,
    networks: 2,
    investigator: "AGENT KAPOOR",
    opened: "2026-08-01",
    updated: "5h ago",
    description:
      "Suspected money laundering via shell companies. Offshore accounts flagged in 3 jurisdictions.",
  },
  {
    id: "CASE-0088",
    name: "Narco Supply Route – Punjab",
    status: "ACTIVE",
    priority: "HIGH",
    entities: 76,
    networks: 8,
    investigator: "AGENT MEHTA",
    opened: "2026-06-20",
    updated: "12h ago",
    description:
      "Cross-border narcotics supply chain spanning Pakistan border. 76 entities identified in transit network.",
  },
  {
    id: "CASE-0083",
    name: "Cybercrime Syndicate – Mumbai",
    status: "PENDING",
    priority: "MEDIUM",
    entities: 29,
    networks: 3,
    investigator: "AGENT VERMA",
    opened: "2026-05-10",
    updated: "2 days ago",
    description:
      "Organized cybercrime group suspected of large-scale phishing and bank fraud operations.",
  },
  {
    id: "CASE-0071",
    name: "Human Trafficking – Network Alpha",
    status: "CLOSED",
    priority: "HIGH",
    entities: 94,
    networks: 11,
    investigator: "AGENT SINGH",
    opened: "2026-02-03",
    updated: "30 days ago",
    description:
      "Dismantled trafficking network. 94 entities prosecuted. Case closed with 12 convictions.",
  },
  {
    id: "CASE-0065",
    name: "Counterfeit Currency Ring",
    status: "CLOSED",
    priority: "LOW",
    entities: 12,
    networks: 1,
    investigator: "AGENT PATEL",
    opened: "2026-01-18",
    updated: "45 days ago",
    description:
      "Small-scale counterfeit operation. Case resolved, suspects in custody.",
  },
];

const statusFilters: (Status | "ALL")[] = ["ALL", "ACTIVE", "PENDING", "CLOSED"];

const priorityColors: Record<Priority, string> = {
  HIGH: "text-red-400 border-red-500/30 bg-red-950/40",
  MEDIUM: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  LOW: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
};

const statusColors: Record<Status, string> = {
  ACTIVE: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30",
  PENDING: "text-amber-400 border-amber-500/30 bg-amber-950/30",
  CLOSED: "text-white/40 border-white/10 bg-white/5",
};

export default function CasesPage() {
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = cases.filter((c) => {
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
            {cases.length} total cases · {cases.filter((c) => c.status === "ACTIVE").length} active
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
            <div
              key={c.id}
              className="relative border border-white/[0.1] bg-[#0c0d12]/80 p-5 hover:border-white/20 transition-all group cursor-pointer"
            >
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

              {/* Investigator */}
              <div className="mt-2 text-[10px] font-mono text-white/25">
                LEAD: {c.investigator}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        CASE DATABASE // FORENSIC INTELLIGENCE ENGINE // AUTHORIZED ACCESS ONLY
      </div>
    </div>
  );
}
