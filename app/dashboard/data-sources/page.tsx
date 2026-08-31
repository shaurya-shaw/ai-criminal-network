"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Database,
  RefreshCw,
  Plus,
  FileText,
  Download,
  ExternalLink,
  Search,
  Clock,
  FolderOpen,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
} from "lucide-react";
import TerminalCard from "../components/TerminalCard";
import IngestIntelligenceModal from "./components/IngestIntelligenceModal";
import ExtractionReviewModal from "./components/ExtractionReviewModal";

export interface DataSourceItem {
  id: string;
  case_id: string;
  filename: string;
  source_type: string;
  storage_path: string;
  mime_type?: string | null;
  file_size?: number | null;
  uploaded_by?: string | null;
  status: "UPLOADED" | "PROCESSING" | "REVIEW" | "IMPORTED" | "FAILED" | string;
  extracted_data?: any | null;
  uploaded_at: string;
  updated_at: string;
  url?: string;
  downloadUrl?: string;
  formattedSize?: string;
}

const sourceTypeBadge: Record<
  string,
  { label: string; color: string; border: string; bg: string }
> = {
  FIR: {
    label: "FIR",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-950/30",
  },
  CDR: {
    label: "CDR",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-950/30",
  },
  FINANCIAL: {
    label: "FINANCIAL",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-950/30",
  },
  SURVEILLANCE: {
    label: "SURVEILLANCE",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-950/30",
  },
  REPORT: {
    label: "REPORT",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/30",
  },
  OSINT: {
    label: "OSINT",
    color: "text-teal-400",
    border: "border-teal-500/30",
    bg: "bg-teal-950/30",
  },
  CUSTOMS: {
    label: "CUSTOMS",
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-950/30",
  },
  OTHER: {
    label: "OTHER",
    color: "text-white/60",
    border: "border-white/20",
    bg: "bg-white/5",
  },
};

const statusConfig: Record<
  string,
  {
    label: string;
    dotColor: string;
    textColor: string;
    border: string;
    bg: string;
    pulse?: boolean;
  }
> = {
  UPLOADED: {
    label: "UPLOADED",
    dotColor: "bg-emerald-400",
    textColor: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/30",
  },
  PROCESSING: {
    label: "PROCESSING",
    dotColor: "bg-amber-400",
    textColor: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-950/30",
    pulse: true,
  },
  REVIEW: {
    label: "REVIEW",
    dotColor: "bg-cyan-400",
    textColor: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-950/30",
  },
  IMPORTED: {
    label: "IMPORTED",
    dotColor: "bg-blue-400",
    textColor: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-950/30",
  },
  FAILED: {
    label: "FAILED",
    dotColor: "bg-red-400",
    textColor: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-950/30",
  },
};

const filterTabs = [
  { id: "ALL", label: "ALL" },
  { id: "FIR", label: "FIR" },
  { id: "CDR", label: "CDR" },
  { id: "FINANCIAL", label: "FINANCIAL" },
  { id: "SURVEILLANCE", label: "SURVEILLANCE" },
  { id: "REPORT", label: "REPORT" },
  { id: "OSINT", label: "OSINT" },
  { id: "CUSTOMS", label: "CUSTOMS" },
  { id: "OTHER", label: "OTHER" },
];

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReviewSource, setSelectedReviewSource] =
    useState<DataSourceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  const fetchSources = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("/api/data-sources");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.sources)) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error("Failed to fetch data sources:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Periodic poll if any document is currently in PROCESSING status
  useEffect(() => {
    const hasProcessing = sources.some((s) => s.status === "PROCESSING");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchSources(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [sources, fetchSources]);

  const handleStatusUpdated = (sourceId: string, newStatus: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, status: newStatus } : s)),
    );
    fetchSources(false);
  };

  const handleDeleteSource = async (sourceId: string, filename: string) => {
    if (
      !window.confirm(
        `Permanently delete '${filename}' from database and cloud storage?`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/data-sources/${sourceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== sourceId));
      } else {
        alert("Failed to delete source.");
      }
    } catch {
      alert("Network error deleting source.");
    }
  };

  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const matchesType =
        selectedSourceFilter === "ALL" ||
        s.source_type === selectedSourceFilter;
      const matchesStatus =
        selectedStatusFilter === "ALL" || s.status === selectedStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.filename.toLowerCase().includes(q) ||
        s.case_id.toLowerCase().includes(q) ||
        s.source_type.toLowerCase().includes(q) ||
        s.storage_path.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [sources, selectedSourceFilter, selectedStatusFilter, searchQuery]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Ingest Data Modal */}
      <IngestIntelligenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchSources(true)}
      />

      {/* Intelligence Extraction Review Modal */}
      <ExtractionReviewModal
        isOpen={!!selectedReviewSource}
        onClose={() => setSelectedReviewSource(null)}
        source={selectedReviewSource}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Metadata Repository
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            DATA SOURCES
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {sources.length} registered data sources · Document Intelligence
            Pipeline
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 px-3.5 py-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>INGEST DATA</span>
          </button>
          <button
            onClick={() => fetchSources(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 border border-white/[0.08] hover:border-white/20 hover:text-white/70 px-3 py-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3 h-3 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
            />
            REFRESH
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename, case ID, source type..."
            className="w-full bg-[#0a0b0e] border border-white/[0.1] pl-9 pr-3 py-1.5 text-[11px] font-mono text-white placeholder:text-white/25 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Source Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSourceFilter(tab.id)}
              className={`px-2.5 py-1 text-[9px] font-mono tracking-widest uppercase transition-all whitespace-nowrap border cursor-pointer ${
                selectedSourceFilter === tab.id
                  ? "border-emerald-400 bg-emerald-950/30 text-emerald-400 font-bold"
                  : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Table Card */}
      <TerminalCard
        title={`DATA SOURCES (${filteredSources.length})`}
        statusLabel={
          isLoading ? "QUERYING POSTGRES..." : `${sources.length} REGISTERED`
        }
        statusColor="emerald"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 text-[9px] tracking-widest uppercase bg-white/[0.01]">
                <th className="text-left py-3 px-5 font-medium">SOURCE</th>
                <th className="text-left py-3 px-3 font-medium">CASE</th>
                <th className="text-left py-3 px-3 font-medium">TYPE</th>
                <th className="text-left py-3 px-3 font-medium">STATUS</th>
                <th className="text-left py-3 px-3 font-medium hidden sm:table-cell">
                  UPLOAD TIME
                </th>
                <th className="text-right py-3 px-5 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span className="text-[10px] tracking-widest uppercase">
                      FETCHING METADATA FROM SUPABASE POSTGRES...
                    </span>
                  </td>
                </tr>
              ) : filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-white/30 mb-3">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="text-[12px] font-bold tracking-widest text-white uppercase mb-1">
                      {searchQuery || selectedSourceFilter !== "ALL"
                        ? "NO MATCHING DATA SOURCES FOUND"
                        : "NO DATA SOURCES INGESTED YET"}
                    </div>
                    <p className="text-[10px] text-white/35 font-mono max-w-sm mx-auto mb-4">
                      {searchQuery || selectedSourceFilter !== "ALL"
                        ? "Try adjusting your search query or source type filter."
                        : "Upload FIRs, CDRs, financial records, or surveillance files to begin tracking."}
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>INGEST DATA</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSources.map((s, i) => {
                  const typeBadge =
                    sourceTypeBadge[s.source_type] || sourceTypeBadge.OTHER;
                  const statusInfo =
                    statusConfig[s.status] || statusConfig.UPLOADED;

                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-white/[0.05] hover:bg-white/[0.025] transition-colors ${
                        i % 2 === 1 ? "bg-white/[0.01]" : ""
                      }`}
                    >
                      {/* SOURCE (filename + storage path) */}
                      <td className="py-3 px-5">
                        <div
                          onClick={() => setSelectedReviewSource(s)}
                          className="group flex items-start gap-2.5 cursor-pointer max-w-xs sm:max-w-sm lg:max-w-md"
                          title="Click to review extracted intelligence"
                        >
                          <div className="p-1.5 bg-white/[0.03] border border-white/10 text-white/40 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold group-hover:text-cyan-400 group-hover:underline transition-colors truncate flex items-center gap-1.5">
                              {s.filename}
                              {s.status === "REVIEW" && (
                                <Sparkles className="w-3 h-3 text-cyan-400 inline" />
                              )}
                            </div>
                            <div className="text-white/30 text-[9px] font-mono truncate">
                              {s.id} · {s.formattedSize || "—"} ·{" "}
                              {s.storage_path}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CASE */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/dashboard/cases/${s.case_id}`}
                          className="inline-flex items-center gap-1 text-[10px] text-white/70 hover:text-cyan-400 hover:underline border border-white/10 bg-white/[0.02] px-2 py-0.5 transition-colors"
                        >
                          <Shield className="w-3 h-3 text-cyan-400" />
                          {s.case_id}
                        </Link>
                      </td>

                      {/* TYPE */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-bold border px-2 py-0.5 inline-block ${typeBadge.color} ${typeBadge.border} ${typeBadge.bg}`}
                        >
                          {typeBadge.label}
                        </span>
                      </td>

                      {/* STATUS (● UPLOADED / ● PROCESSING / ● REVIEW / ● IMPORTED / ● FAILED) */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedReviewSource(s)}
                          className={`inline-flex items-center gap-1.5 text-[9px] font-semibold border px-2 py-0.5 transition-all cursor-pointer hover:brightness-125 ${statusInfo.textColor} ${statusInfo.border} ${statusInfo.bg}`}
                          title="Click to view extraction details"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor} ${
                              statusInfo.pulse ? "animate-pulse" : ""
                            }`}
                          />
                          {statusInfo.label}
                          {s.status === "PROCESSING" && (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin ml-0.5" />
                          )}
                        </button>
                      </td>

                      {/* UPLOAD TIME */}
                      <td className="py-3 px-3 text-white/35 hidden sm:table-cell font-mono text-[10px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(s.uploaded_at)}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Review Extraction Button */}
                          <button
                            onClick={() => setSelectedReviewSource(s)}
                            className="p-1.5 text-white/50 hover:text-cyan-400 hover:bg-cyan-950/30 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                            title="Review extracted intelligence"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Preview in New Tab */}
                          <a
                            href={s.url || s.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-white/50 hover:text-emerald-400 hover:bg-emerald-950/30 border border-white/10 hover:border-emerald-500/30 transition-all"
                            title="Preview file in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Download */}
                          <a
                            href={s.downloadUrl || s.url}
                            download={s.filename}
                            className="p-1.5 text-white/50 hover:text-cyan-400 hover:bg-cyan-950/30 border border-white/10 hover:border-cyan-500/30 transition-all"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSource(s.id, s.filename)}
                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-950/30 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                            title="Delete file and record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </TerminalCard>

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3 flex justify-between">
        <span>DATA METADATA ENGINE // SUPABASE POSTGRES</span>
        <span>STATUS LIFECYCLE: UPLOADED ➔ PROCESSING ➔ REVIEW ➔ IMPORTED</span>
      </div>
    </div>
  );
}
