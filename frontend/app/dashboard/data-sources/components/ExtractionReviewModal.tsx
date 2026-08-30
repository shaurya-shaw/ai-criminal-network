"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  GitBranch,
  Calendar,
  Quote,
  Code,
  Shield,
  Download,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { DataSourceItem } from "../page";
import {
  IntelligenceExtractionResult,
  ExtractedEntity,
  ExtractedRelationship,
  ExtractedEvent,
  ExtractedEvidenceRef,
} from "@/lib/ai/types";

interface ExtractionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: DataSourceItem | null;
  onStatusUpdated?: (sourceId: string, newStatus: string) => void;
}

const entityTypeColors: Record<
  string,
  { border: string; bg: string; text: string; dot: string }
> = {
  Person: {
    border: "border-red-500/30",
    bg: "bg-red-950/20",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  Organization: {
    border: "border-amber-500/30",
    bg: "bg-amber-950/20",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  Location: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-950/20",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  Phone: {
    border: "border-purple-500/30",
    bg: "bg-purple-950/20",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  Vehicle: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-950/20",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
  },
  BankAccount: {
    border: "border-yellow-500/30",
    bg: "bg-yellow-950/20",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
  },
};

export default function ExtractionReviewModal({
  isOpen,
  onClose,
  source,
  onStatusUpdated,
}: ExtractionReviewModalProps) {
  const [activeTab, setActiveTab] = useState<
    "ENTITIES" | "RELATIONSHIPS" | "EVENTS" | "EVIDENCE" | "JSON"
  >("ENTITIES");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [extraction, setExtraction] =
    useState<IntelligenceExtractionResult | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(
    source?.status || "UPLOADED"
  );

  // Sync currentStatus when source prop changes
  React.useEffect(() => {
    if (source?.status) {
      setCurrentStatus(source.status);
    }
  }, [source?.status]);

  // Auto-fetch or re-use extraction on modal open
  React.useEffect(() => {
    if (!source || !isOpen) {
      setExtraction(null);
      return;
    }

    if (source.extracted_data) {
      setExtraction(source.extracted_data);
      return;
    }

    // Auto-fetch from process endpoint if extracted_data is not in local source state
    let isCancelled = false;
    const loadExtraction = async () => {
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/data-sources/${source.id}/process`, {
          method: "POST",
        });
        const data = await res.json();
        if (!isCancelled && data.success && data.extraction) {
          setExtraction(data.extraction);
          setCurrentStatus("REVIEW");
          if (onStatusUpdated) {
            onStatusUpdated(source.id, "REVIEW");
          }
        }
      } catch (err) {
        console.warn("Auto-load extraction failed:", err);
      } finally {
        if (!isCancelled) setIsProcessing(false);
      }
    };

    loadExtraction();

    return () => {
      isCancelled = true;
    };
  }, [source?.id, isOpen]);

  if (!isOpen || !source) return null;

  const handleUpdateStatus = async (newStatus: "IMPORTED" | "FAILED") => {
    setIsUpdatingStatus(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/data-sources/${source.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentStatus(newStatus);
        setActionFeedback(
          newStatus === "IMPORTED"
            ? "Extraction approved! Document imported into case evidence log."
            : "Extraction rejected. Flagged as failed inspection."
        );
        if (onStatusUpdated) {
          onStatusUpdated(source.id, newStatus);
        }
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setActionFeedback(data.error || "Failed to update status.");
      }
    } catch (err) {
      setActionFeedback("Network error updating status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReProcess = async () => {
    setIsProcessing(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/data-sources/${source.id}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success && data.extraction) {
        setExtraction(data.extraction);
        setActionFeedback("AI analysis re-executed successfully.");
        if (onStatusUpdated) {
          onStatusUpdated(source.id, "REVIEW");
        }
      } else {
        setActionFeedback(data.error || "Failed to analyze document.");
      }
    } catch {
      setActionFeedback("Failed to connect to AI engine.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 font-mono text-white">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl border border-white/[0.15] bg-[#0a0b0e] text-white shadow-2xl z-10 max-h-[88vh] flex flex-col overflow-hidden">
        {/* Corner Brackets */}
        <div className="absolute -top-[1px] -left-[1px] w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute -top-[1px] -right-[1px] w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold tracking-widest text-white uppercase">
                  INTELLIGENCE EXTRACTION REVIEW
                </span>
                <span className="text-[9px] px-2 py-0.5 border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 font-bold">
                  {currentStatus}
                </span>
                {extraction?.confidenceScore && (
                  <span className="text-[9px] px-2 py-0.5 border border-emerald-500/30 bg-emerald-950/30 text-emerald-400 font-bold font-mono">
                    {extraction.confidenceScore}% CONFIDENCE
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/40 block truncate max-w-md mt-0.5">
                {source.id} // {source.filename} · Case {source.case_id}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs - Clean Spacing Up/Down, Zero Horizontal Scroll */}
        <div className="px-5 py-3 border-b border-white/[0.08] bg-black/30 shrink-0">
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("ENTITIES")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-mono tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === "ENTITIES"
                  ? "border-cyan-400 text-cyan-400 font-bold bg-cyan-950/30"
                  : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>ENTITIES</span>
              <span className="text-[9px] opacity-60">({extraction?.entities?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RELATIONSHIPS")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-mono tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === "RELATIONSHIPS"
                  ? "border-cyan-400 text-cyan-400 font-bold bg-cyan-950/30"
                  : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span>RELATIONS</span>
              <span className="text-[9px] opacity-60">({extraction?.relationships?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("EVENTS")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-mono tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === "EVENTS"
                  ? "border-cyan-400 text-cyan-400 font-bold bg-cyan-950/30"
                  : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>EVENTS</span>
              <span className="text-[9px] opacity-60">({extraction?.events?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("EVIDENCE")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-mono tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === "EVIDENCE"
                  ? "border-cyan-400 text-cyan-400 font-bold bg-cyan-950/30"
                  : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <Quote className="w-3.5 h-3.5 shrink-0" />
              <span>EXCERPTS</span>
              <span className="text-[9px] opacity-60">({extraction?.evidenceReferences?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("JSON")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-[10px] font-mono tracking-wider uppercase border transition-all cursor-pointer ${
                activeTab === "JSON"
                  ? "border-cyan-400 text-cyan-400 font-bold bg-cyan-950/30"
                  : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <Code className="w-3.5 h-3.5 shrink-0" />
              <span>RAW JSON</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[280px]">
          {isProcessing && !extraction && (
            <div className="py-16 text-center space-y-3">
              <div className="relative w-12 h-12 mx-auto">
                <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin opacity-80" />
                <Sparkles className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-[12px] font-bold tracking-widest text-cyan-400 uppercase">
                ANALYZING DOCUMENT ...
              </div>
              <p className="text-[10px] text-white/40 max-w-md mx-auto leading-relaxed">
                Extracting persons of interest, phone records, bank accounts,
                and cross-entity relationship networks.
              </p>
            </div>
          )}

          {/* TAB 1: ENTITIES */}
          {(!isProcessing || !!extraction) && activeTab === "ENTITIES" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {extraction?.entities && extraction.entities.length > 0 ? (
                extraction.entities.map((ent, idx) => {
                  const cfg =
                    entityTypeColors[ent.type] || entityTypeColors.Person;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 border ${cfg.border} ${cfg.bg} space-y-2 relative`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            <span className="text-[12px] font-bold text-white">
                              {ent.name}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase ${cfg.text}`}
                          >
                            {ent.type} · {ent.role || "Identified Entity"}
                          </span>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-mono">
                          {ent.confidence}% CONF
                        </span>
                      </div>

                      {/* Aliases */}
                      {ent.aliases && ent.aliases.length > 0 && (
                        <div className="text-[9px] text-white/50 flex flex-wrap gap-1">
                          <span className="text-white/30">AKA:</span>
                          {ent.aliases.map((a, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-black/40 border border-white/10 text-white/70"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Attributes */}
                      {ent.attributes &&
                        Object.keys(ent.attributes).length > 0 && (
                          <div className="pt-1 border-t border-white/[0.06] grid grid-cols-2 gap-1.5 text-[9px] text-white/50">
                            {Object.entries(ent.attributes).map(([k, v]) => (
                              <div key={k} className="truncate">
                                <span className="text-white/30 uppercase">
                                  {k}:{" "}
                                </span>
                                <span className="text-white/80">
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 py-8 text-center text-white/40 text-[11px]">
                  No structured entities extracted yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RELATIONSHIPS */}
          {activeTab === "RELATIONSHIPS" && (
            <div className="space-y-2">
              {extraction?.relationships &&
              extraction.relationships.length > 0 ? (
                extraction.relationships.map((rel, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white bg-black/40 px-2 py-0.5 border border-white/15">
                        {rel.source}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] px-2 py-0.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-bold uppercase">
                        <span>➔</span>
                        <span>{rel.type}</span>
                      </div>
                      <span className="font-bold text-white bg-black/40 px-2 py-0.5 border border-white/15">
                        {rel.target}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                      <span className="text-[10px] text-white/50 italic max-w-xs truncate text-left sm:text-right">
                        {rel.description}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-mono shrink-0">
                        {rel.confidence}% CONF
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-white/40 text-[11px]">
                  No relationships extracted yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EVENTS */}
          {activeTab === "EVENTS" && (
            <div className="space-y-2">
              {extraction?.events && extraction.events.length > 0 ? (
                extraction.events.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-white/[0.08] bg-white/[0.02] space-y-1.5 text-[11px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[9px] bg-purple-950/40 border border-purple-500/30 text-purple-400 font-bold uppercase">
                          {ev.type}
                        </span>
                        <span className="font-bold text-white">{ev.title}</span>
                      </div>
                      {ev.timestamp && (
                        <span className="text-[9px] text-white/40 font-mono">
                          {ev.timestamp}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/60 leading-relaxed">
                      {ev.description}
                    </p>
                    {ev.location && (
                      <div className="text-[9px] text-white/40">
                        <span className="text-white/25 uppercase">
                          Location:{" "}
                        </span>
                        {ev.location}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-white/40 text-[11px]">
                  No timeline events detected in this document.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVIDENCE CITATIONS */}
          {activeTab === "EVIDENCE" && (
            <div className="space-y-2.5">
              {extraction?.evidenceReferences &&
              extraction.evidenceReferences.length > 0 ? (
                extraction.evidenceReferences.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-white/[0.08] bg-white/[0.02] space-y-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-[9px] text-white/40">
                      <span className="uppercase text-cyan-400 font-semibold">
                        {ref.pageOrSection || `Citation #${idx + 1}`}
                      </span>
                      <span>{ref.relevance}</span>
                    </div>
                    <blockquote className="border-l-2 border-cyan-400/60 pl-2.5 py-0.5 text-white/80 text-[10px] italic">
                      &ldquo;{ref.excerpt}&rdquo;
                    </blockquote>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-white/40 text-[11px]">
                  No evidence citations recorded.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RAW JSON */}
          {activeTab === "JSON" && (
            <pre className="p-3.5 bg-black/60 border border-white/[0.08] text-[10px] text-cyan-300/90 font-mono overflow-x-auto max-h-80 select-all">
              {JSON.stringify(extraction || source, null, 2)}
            </pre>
          )}
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="px-5 py-2 bg-emerald-950/40 border-t border-emerald-500/30 text-emerald-400 text-[10px] flex items-center justify-between">
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border-t border-white/[0.08] bg-white/[0.02] gap-3">
          <div className="flex items-center gap-2">
            <a
              href={source.url || source.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-[10px] border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              VIEW ORIGINAL
            </a>
            <button
              onClick={handleReProcess}
              disabled={isProcessing}
              className="px-3 py-2 text-[10px] border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`}
              />
              {isProcessing ? "ANALYZING..." : "RE-ANALYZE"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStatus === "IMPORTED" ? (
              <div className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 font-mono shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                INTELLIGENCE APPROVED & IMPORTED
              </div>
            ) : currentStatus === "FAILED" ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-red-400/80 font-mono px-2 py-1 bg-red-950/30 border border-red-500/30">
                  REJECTED
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("IMPORTED")}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  [ RE-APPROVE & IMPORT ]
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("FAILED")}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-none px-4 py-2 text-[10px] font-bold tracking-widest uppercase border border-red-500/40 text-red-400 hover:bg-red-950/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />[ REJECT ]
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus("IMPORTED")}
                  disabled={isUpdatingStatus}
                  className="flex-1 sm:flex-none px-5 py-2 text-[10px] font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />[ APPROVE & IMPORT ]
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
