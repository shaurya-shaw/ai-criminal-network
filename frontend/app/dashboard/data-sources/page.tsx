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
  HardDrive,
  FolderOpen,
  Eye,
  Shield,
  Layers,
} from "lucide-react";
import TerminalCard from "../components/TerminalCard";
import IngestIntelligenceModal from "./components/IngestIntelligenceModal";

export interface IntelligenceFile {
  id: string;
  name: string;
  rawName: string;
  caseId: string;
  sourceType: string;
  size: number;
  formattedSize: string;
  storagePath: string;
  url: string;
  downloadUrl: string;
  uploadedAt: string;
}

const sourceTypeBadge: Record<
  string,
  { label: string; color: string; border: string; bg: string }
> = {
  FIR: {
    label: "FIR / REPORT",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-950/30",
  },
  CDRS: {
    label: "CDRS FEED",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-950/30",
  },
  FINANCIAL_RECORD: {
    label: "FINANCIAL",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-950/30",
  },
  SURVEILLANCE_REPORT: {
    label: "SURVEILLANCE",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-950/30",
  },
  OSINT: {
    label: "OSINT",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/30",
  },
  CUSTOMS_RECORD: {
    label: "CUSTOMS",
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-950/30",
  },
  OTHER: {
    label: "DOCUMENT",
    color: "text-white/60",
    border: "border-white/20",
    bg: "bg-white/5",
  },
};

const filterTabs = [
  { id: "ALL", label: "ALL FILES" },
  { id: "FIR", label: "FIR / REPORTS" },
  { id: "CDRS", label: "CDRS" },
  { id: "FINANCIAL_RECORD", label: "FINANCIAL" },
  { id: "SURVEILLANCE_REPORT", label: "SURVEILLANCE" },
  { id: "OSINT", label: "OSINT" },
  { id: "CUSTOMS_RECORD", label: "CUSTOMS" },
  { id: "OTHER", label: "OTHER" },
];

export default function DataSourcesPage() {
  const [files, setFiles] = useState<IntelligenceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("ALL");
  const [totalBytes, setTotalBytes] = useState(0);

  const fetchFiles = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("/api/data-sources");
      const data = await res.json();
      if (data && data.success && Array.isArray(data.files)) {
        setFiles(data.files);
        setTotalBytes(data.totalBytes || 0);
      }
    } catch (err) {
      console.error("Failed to fetch intelligence files:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesFilter =
        selectedSourceFilter === "ALL" || f.sourceType === selectedSourceFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.caseId.toLowerCase().includes(q) ||
        f.sourceType.toLowerCase().includes(q) ||
        f.storagePath.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [files, selectedSourceFilter, searchQuery]);

  const formatTotalSize = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

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
      {/* Ingest Intelligence Modal */}
      <IngestIntelligenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchFiles(true)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
              Intelligence / Data Sources & Storage Vault
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Data Sources & Repository
          </h1>
          <p className="text-[11px] text-white/40 font-mono mt-0.5">
            {files.length} uploaded intelligence files · {formatTotalSize(totalBytes)} stored in Supabase Vault
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 px-3.5 py-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            ADD INTELLIGENCE
          </button>
          <button
            onClick={() => fetchFiles(true)}
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
            placeholder="Search by file name, case ID, source type..."
            className="w-full bg-[#0a0b0e] border border-white/[0.1] pl-9 pr-3 py-1.5 text-[11px] font-mono text-white placeholder:text-white/25 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSourceFilter(tab.id)}
              className={`px-2.5 py-1 text-[9px] font-mono tracking-widest uppercase transition-all whitespace-nowrap border ${
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

      {/* Files Table Card */}
      <TerminalCard
        title={`INGESTED FILES (${filteredFiles.length})`}
        statusLabel={isLoading ? "LOADING..." : `${files.length} STORED`}
        statusColor="emerald"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/[0.07] text-white/30 text-[9px] tracking-widest uppercase bg-white/[0.01]">
                <th className="text-left py-3 px-5 font-medium">INTELLIGENCE FILE / NAME</th>
                <th className="text-left py-3 px-3 font-medium">CASE ASSOCIATION</th>
                <th className="text-left py-3 px-3 font-medium">SOURCE TYPE</th>
                <th className="text-left py-3 px-3 font-medium hidden sm:table-cell">SIZE</th>
                <th className="text-left py-3 px-3 font-medium hidden md:table-cell">INGESTED AT</th>
                <th className="text-right py-3 px-5 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span className="text-[10px] tracking-widest uppercase">
                      QUERYING SUPABASE VAULT...
                    </span>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-white/30 mb-3">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="text-[12px] font-bold tracking-widest text-white uppercase mb-1">
                      {searchQuery || selectedSourceFilter !== "ALL"
                        ? "NO MATCHING INTELLIGENCE FILES FOUND"
                        : "NO INTELLIGENCE FILES INGESTED YET"}
                    </div>
                    <p className="text-[10px] text-white/35 font-mono max-w-sm mx-auto mb-4">
                      {searchQuery || selectedSourceFilter !== "ALL"
                        ? "Try adjusting your search query or source filter."
                        : "Upload FIRs, CDRs, financial records, or surveillance material to populate the vault."}
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 transition-all inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      INGEST FIRST FILE
                    </button>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((f, i) => {
                  const badge = sourceTypeBadge[f.sourceType] || sourceTypeBadge.OTHER;
                  return (
                    <tr
                      key={f.id}
                      className={`border-b border-white/[0.05] hover:bg-white/[0.025] transition-colors ${
                        i % 2 === 1 ? "bg-white/[0.01]" : ""
                      }`}
                    >
                      {/* File Name & Path */}
                      <td className="py-3 px-5">
                        <a
                          href={f.url || f.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-2.5 cursor-pointer max-w-xs sm:max-w-sm lg:max-w-md"
                          title="Click to preview file in a new tab"
                        >
                          <div className="p-1.5 bg-white/[0.03] border border-white/10 text-white/40 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-semibold group-hover:text-emerald-400 group-hover:underline transition-colors truncate">
                              {f.name}
                            </div>
                            <div className="text-white/30 text-[9px] font-mono truncate">
                              {f.storagePath}
                            </div>
                          </div>
                        </a>
                      </td>

                      {/* Case Association */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/dashboard/cases/${f.caseId}`}
                          className="inline-flex items-center gap-1 text-[10px] text-white/70 hover:text-cyan-400 hover:underline border border-white/10 bg-white/[0.02] px-2 py-0.5 transition-colors"
                        >
                          <Shield className="w-3 h-3 text-cyan-400" />
                          {f.caseId}
                        </Link>
                      </td>

                      {/* Source Type */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] border px-2 py-0.5 inline-block ${badge.color} ${badge.border} ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 text-white/40 hidden sm:table-cell font-mono">
                        {f.formattedSize}
                      </td>

                      {/* Ingested At */}
                      <td className="py-3 px-3 text-white/35 hidden md:table-cell font-mono text-[10px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(f.uploadedAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview in New Tab */}
                          <a
                            href={f.url || f.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-white/50 hover:text-emerald-400 hover:bg-emerald-950/30 border border-white/10 hover:border-emerald-500/30 transition-all"
                            title="Preview document in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Download */}
                          <a
                            href={f.downloadUrl || f.url}
                            download={f.name}
                            className="p-1.5 text-white/50 hover:text-cyan-400 hover:bg-cyan-950/30 border border-white/10 hover:border-cyan-500/30 transition-all"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
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
        <span>DATA INGESTION ENGINE // SUPABASE STORAGE VAULT</span>
        <span>ACCESS: RESTRICTED // TLS 1.3 ENCRYPTED</span>
      </div>
    </div>
  );
}
