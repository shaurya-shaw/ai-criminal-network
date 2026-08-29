"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  User,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import TerminalCard from "../components/TerminalCard";

type EntityType = "PERSON" | "ORGANIZATION" | "LOCATION" | "PHONE" | "ACCOUNT";

interface Entity {
  id: string;
  name: string;
  alias?: string;
  type: EntityType;
  riskScore: number;
  cases: string[];
  lastSeen: string;
  status: "FLAGGED" | "MONITORING" | "CLEARED";
}

const entities: Entity[] = [
  {
    id: "E-1482",
    name: "Arjun Rawat",
    alias: "AJ",
    type: "PERSON",
    riskScore: 94,
    cases: ["CASE-0091", "CASE-0088"],
    lastSeen: "2026-08-29",
    status: "FLAGGED",
  },
  {
    id: "E-1301",
    name: "Nexus Trade Pvt. Ltd.",
    type: "ORGANIZATION",
    riskScore: 87,
    cases: ["CASE-0092"],
    lastSeen: "2026-08-27",
    status: "FLAGGED",
  },
  {
    id: "E-0774",
    name: "Rajan Mehra",
    alias: "The Broker",
    type: "PERSON",
    riskScore: 91,
    cases: ["CASE-0091", "CASE-0088", "CASE-0083"],
    lastSeen: "2026-08-28",
    status: "FLAGGED",
  },
  {
    id: "E-0941",
    name: "+91-98765-43210",
    type: "PHONE",
    riskScore: 62,
    cases: ["CASE-0091"],
    lastSeen: "2026-08-25",
    status: "MONITORING",
  },
  {
    id: "E-0822",
    name: "Patel Logistics",
    type: "ORGANIZATION",
    riskScore: 55,
    cases: ["CASE-0088"],
    lastSeen: "2026-08-20",
    status: "MONITORING",
  },
  {
    id: "E-0610",
    name: "Amritsar Warehouse, Block 4",
    type: "LOCATION",
    riskScore: 78,
    cases: ["CASE-0088"],
    lastSeen: "2026-08-22",
    status: "MONITORING",
  },
  {
    id: "E-1155",
    name: "ACC-007742881",
    type: "ACCOUNT",
    riskScore: 83,
    cases: ["CASE-0092"],
    lastSeen: "2026-08-26",
    status: "FLAGGED",
  },
  {
    id: "E-0390",
    name: "Sameer Khan",
    alias: "SKhan",
    type: "PERSON",
    riskScore: 34,
    cases: ["CASE-0083"],
    lastSeen: "2026-08-10",
    status: "CLEARED",
  },
];

const typeFilters: (EntityType | "ALL")[] = [
  "ALL",
  "PERSON",
  "ORGANIZATION",
  "LOCATION",
  "PHONE",
  "ACCOUNT",
];

const typeIcons: Record<EntityType, React.ElementType> = {
  PERSON: User,
  ORGANIZATION: Building2,
  LOCATION: MapPin,
  PHONE: Phone,
  ACCOUNT: CreditCard,
};

const typeColors: Record<EntityType, string> = {
  PERSON: "text-emerald-400",
  ORGANIZATION: "text-cyan-400",
  LOCATION: "text-amber-400",
  PHONE: "text-purple-400",
  ACCOUNT: "text-blue-400",
};

const statusColors = {
  FLAGGED: "text-red-400 border-red-500/30 bg-red-950/40",
  MONITORING: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  CLEARED: "text-white/40 border-white/10 bg-white/5",
};

const riskColor = (score: number) => {
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-cyan-400";
  return "text-white/40";
};

type SortField = "riskScore" | "name" | "lastSeen";
type SortDir = "asc" | "desc";

export default function EntitiesPage() {
  const [typeFilter, setTypeFilter] = useState<EntityType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = entities
    .filter((e) => {
      const matchType = typeFilter === "ALL" || e.type === typeFilter;
      const matchSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase()) ||
        (e.alias && e.alias.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "riskScore") cmp = a.riskScore - b.riskScore;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      if (sortField === "lastSeen")
        cmp = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (
      sortDir === "desc" ? (
        <ChevronDown className="w-3 h-3 inline ml-0.5" />
      ) : (
        <ChevronUp className="w-3 h-3 inline ml-0.5" />
      )
    ) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Entity Registry
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Entity Registry
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {entities.length} entities indexed ·{" "}
            {entities.filter((e) => e.status === "FLAGGED").length} flagged
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE INDEX
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center flex-wrap gap-1">
          {typeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-2.5 py-1 text-[9px] font-mono tracking-widest uppercase transition-colors border ${
                typeFilter === f
                  ? "border-white/20 bg-white/[0.08] text-white"
                  : "border-white/[0.06] text-white/35 hover:text-white/60 hover:bg-white/[0.03] hover:border-white/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-mono sm:ml-auto sm:max-w-xs w-full sm:w-auto">
          <Search className="w-3 h-3 shrink-0" />
          <input
            type="text"
            placeholder="Search name, ID, alias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white/70 placeholder:text-white/25 w-full text-[11px] font-mono"
          />
        </div>
      </div>

      {/* Table */}
      <TerminalCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 text-[9px] tracking-widest uppercase px-5">
                <th className="text-left py-3 px-5 font-medium">ID</th>
                <th
                  className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white/60 select-none"
                  onClick={() => handleSort("name")}
                >
                  NAME <SortIcon field="name" />
                </th>
                <th className="text-left py-3 px-3 font-medium">TYPE</th>
                <th
                  className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white/60 select-none"
                  onClick={() => handleSort("riskScore")}
                >
                  RISK <SortIcon field="riskScore" />
                </th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell">
                  CASES
                </th>
                <th
                  className="text-left py-3 px-3 font-medium cursor-pointer hover:text-white/60 select-none hidden lg:table-cell"
                  onClick={() => handleSort("lastSeen")}
                >
                  LAST SEEN <SortIcon field="lastSeen" />
                </th>
                <th className="text-left py-3 px-3 pr-5 font-medium">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entity, i) => {
                const Icon = typeIcons[entity.type];
                return (
                  <tr
                    key={entity.id}
                    className={`border-b border-white/[0.05] hover:bg-white/[0.025] transition-colors cursor-pointer ${
                      i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    }`}
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
                        className={`flex items-center gap-1.5 ${typeColors[entity.type]}`}
                      >
                        <Icon className="w-3 h-3" />
                        {entity.type}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${riskColor(entity.riskScore)}`}>
                        {entity.riskScore}
                      </span>
                      <span className="text-white/20">/100</span>
                    </td>
                    <td className="py-3 px-3 hidden md:table-cell text-white/40">
                      {entity.cases.join(", ")}
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell text-white/30">
                      {entity.lastSeen}
                    </td>
                    <td className="py-3 px-3 pr-5">
                      <span
                        className={`text-[9px] border px-2 py-0.5 ${statusColors[entity.status]}`}
                      >
                        {entity.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-white/25 font-mono text-[11px] tracking-widest uppercase">
              No entities found
            </div>
          )}
        </div>
      </TerminalCard>

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        ENTITY REGISTRY // {filtered.length} of {entities.length} records · FORENSIC INTELLIGENCE ENGINE
      </div>
    </div>
  );
}
