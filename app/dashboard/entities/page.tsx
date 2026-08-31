"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  User,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  Car,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import TerminalCard from "../components/TerminalCard";
import type { EntityType, EntityStatus, Entity } from "@/lib/api/types";

const typeFilters: (EntityType | "ALL")[] = [
  "ALL",
  "PERSON",
  "ORGANIZATION",
  "LOCATION",
  "PHONE",
  "ACCOUNT",
  "VEHICLE",
];

const typeIcons: Record<EntityType, React.ElementType> = {
  PERSON: User,
  ORGANIZATION: Building2,
  LOCATION: MapPin,
  PHONE: Phone,
  ACCOUNT: CreditCard,
  VEHICLE: Car,
};

const typeColors: Record<EntityType, string> = {
  PERSON: "text-emerald-400",
  ORGANIZATION: "text-cyan-400",
  LOCATION: "text-amber-400",
  PHONE: "text-purple-400",
  ACCOUNT: "text-blue-400",
  VEHICLE: "text-rose-400",
};

const statusColors: Record<EntityStatus, string> = {
  FLAGGED: "text-red-400 border-red-500/30 bg-red-950/40",
  MONITORING: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  CLEARED: "text-white/40 border-white/10 bg-white/5",
};

const riskColor = (score: number) => {
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-amber-400";
  return "text-emerald-400";
};

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flaggedCount, setFlaggedCount] = useState(0);

  const [typeFilter, setTypeFilter] = useState<EntityType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"riskScore" | "name" | "lastSeen">("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchEntities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("sortBy", sortField);
      params.set("sortOrder", sortDir);

      const res = await fetch(`/api/entities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.entities)) {
          setEntities(data.entities);
          setFlaggedCount(data.flaggedCount || 0);
        }
      } else {
        setError("Failed to query entity records from database.");
      }
    } catch (err) {
      console.warn("Could not fetch entities from API:", err);
      setError("Network or server connection error.");
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, search, sortField, sortDir]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleSort = (field: "riskScore" | "name" | "lastSeen") => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Global Registry
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Entity Registry
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {entities.length} indexed entities · {flaggedCount} flagged high-risk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntities}
            disabled={isLoading}
            className="p-1.5 border border-white/10 text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
            title="Refresh entities"
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

      {/* Type filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Type tabs */}
        <div className="flex items-center border border-white/[0.08] bg-[#0c0d12] overflow-x-auto max-w-full">
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors border-r border-white/[0.06] last:border-r-0 whitespace-nowrap ${
                typeFilter === t
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-mono flex-1 sm:max-w-xs">
          <Search className="w-3 h-3 shrink-0" />
          <input
            type="text"
            placeholder="Search name, alias, ID..."
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
            onClick={fetchEntities}
            className="text-[10px] font-mono text-cyan-400 underline uppercase"
          >
            Retry Fetching Entities
          </button>
        </div>
      )}

      {/* Entities table */}
      <TerminalCard
        title="EXTRACTED ENTITY DIRECTORY"
        statusLabel={`${entities.length} TOTAL`}
        statusColor="cyan"
      >

        {isLoading && entities.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
            <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
              QUERYING ENTITY REGISTRY...
            </p>
          </div>
        ) : entities.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-white/30 font-mono text-[11px] tracking-widest uppercase">
              No entity records found
            </p>
            <p className="text-[10px] font-mono text-white/20 max-w-sm mx-auto">
              Ingest an FIR, CDR, or investigation report in Data Sources. AI entity extraction will automatically index and persist suspects, organizations, phones, and vehicles here.
            </p>
            <Link
              href="/dashboard/data-sources"
              className="inline-block px-4 py-2 border border-white/10 text-cyan-400 font-mono text-[10px] hover:bg-white/[0.04] transition-colors"
            >
              Go to Data Sources →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/40 text-[10px] uppercase tracking-wider">
                  <th className="text-left py-2 px-3">ID</th>
                  <th
                    className="text-left py-2 px-3 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Entity Name
                      {sortField === "name" &&
                        (sortDir === "asc" ? (
                          <ChevronUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-cyan-400" />
                        ))}
                    </div>
                  </th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th
                    className="text-left py-2 px-3 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("riskScore")}
                  >
                    <div className="flex items-center gap-1">
                      Risk Score
                      {sortField === "riskScore" &&
                        (sortDir === "asc" ? (
                          <ChevronUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-cyan-400" />
                        ))}
                    </div>
                  </th>
                  <th className="text-left py-2 px-3">Linked Cases</th>
                  <th
                    className="text-left py-2 px-3 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("lastSeen")}
                  >
                    <div className="flex items-center gap-1">
                      Last Seen
                      {sortField === "lastSeen" &&
                        (sortDir === "asc" ? (
                          <ChevronUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-cyan-400" />
                        ))}
                    </div>
                  </th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {entities.map((e) => {
                  const Icon = typeIcons[e.type] || User;
                  const color = typeColors[e.type] || "text-white/60";
                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2.5 px-3 text-white/30">{e.id}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{e.name}</div>
                        {e.alias && (
                          <div className="text-[10px] text-white/40">
                            Alias: {e.alias}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className={`flex items-center gap-1.5 ${color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{e.type}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${riskColor(e.riskScore)}`}>
                            {e.riskScore}
                          </span>
                          <div className="w-12 h-1 bg-white/[0.08] overflow-hidden">
                            <div
                              className={`h-full ${
                                e.riskScore >= 80
                                  ? "bg-red-400"
                                  : e.riskScore >= 60
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                              }`}
                              style={{ width: `${e.riskScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {e.cases && e.cases.length > 0 ? (
                            e.cases.map((c) => (
                              <Link
                                key={c}
                                href={`/dashboard/cases/${c}`}
                                className="text-[9px] border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-white/50 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                              >
                                {c}
                              </Link>
                            ))
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-white/40">{e.lastSeen}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[9px] border px-2 py-0.5 ${
                            statusColors[e.status] || statusColors.MONITORING
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TerminalCard>
    </div>
  );
}
