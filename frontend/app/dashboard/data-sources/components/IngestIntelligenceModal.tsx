"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Plus,
  Shield,
  Clock,
  Database,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface CaseOption {
  id: string;
  name: string;
  priority: string;
}

interface IngestIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: {
    caseId: string;
    file: { name: string; storagePath: string; size: number };
  }) => void;
}

const SOURCE_TYPES = [
  { value: "FIR", label: "FIR / Investigative Report", icon: "📑" },
  { value: "CDRS", label: "CDRS / Telecommunications Feed", icon: "📞" },
  { value: "FINANCIAL_RECORD", label: "Financial / Banking Statement", icon: "💳" },
  { value: "SURVEILLANCE_REPORT", label: "Surveillance / CCTV Index", icon: "👁️" },
  { value: "OSINT", label: "OSINT / Social Media Harvest", icon: "🌐" },
  { value: "CUSTOMS_RECORD", label: "Customs & Border Record", icon: "🛂" },
  { value: "OTHER", label: "Other Intelligence Material", icon: "📁" },
];

export default function IngestIntelligenceModal({
  isOpen,
  onClose,
  onSuccess,
}: IngestIntelligenceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState("FIR");
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [isCreatingNewCase, setIsCreatingNewCase] = useState(false);
  const [newCaseName, setNewCaseName] = useState("");
  const [newCasePriority, setNewCasePriority] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [newCaseJurisdiction, setNewCaseJurisdiction] = useState("NATIONAL");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    caseId: string;
    caseName: string;
    fileName: string;
    storagePath: string;
    size: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available cases on modal open
  useEffect(() => {
    if (!isOpen) return;

    async function fetchCases() {
      try {
        const res = await fetch("/api/cases");
        if (res.ok) {
          const data = await res.json();
          if (data?.cases?.length > 0) {
            setCases(data.cases);
            setSelectedCaseId(data.cases[0].id);
          }
        }
      } catch {
        // Fallback default list
        const fallback = [
          { id: "CASE-0091", name: "Operation Black Web", priority: "HIGH" },
          { id: "CASE-0092", name: "Financial Investigation – Offshore", priority: "MEDIUM" },
          { id: "CASE-0088", name: "Narco Supply Route – Punjab", priority: "HIGH" },
        ];
        setCases(fallback);
        setSelectedCaseId(fallback[0].id);
      }
    }

    fetchCases();
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setSourceType("FIR");
      setIsCreatingNewCase(false);
      setNewCaseName("");
      setTitle("");
      setNotes("");
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStep("");
      setErrorMessage(null);
      setUploadResult(null);
    }
  }, [isOpen]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select or drop a file to ingest.");
      return;
    }

    if (isCreatingNewCase && !newCaseName.trim()) {
      setErrorMessage("Please provide a name for the new case.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(15);
    setUploadStep("AUTHENTICATING & AUTHORIZING OPERATOR...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sourceType", sourceType);
      formData.append("title", title || file.name);
      formData.append("notes", notes);

      if (isCreatingNewCase) {
        formData.append("caseId", "NEW");
        formData.append("newCaseName", newCaseName.trim());
        formData.append("newCasePriority", newCasePriority);
        formData.append("newCaseJurisdiction", newCaseJurisdiction);
      } else {
        formData.append("caseId", selectedCaseId);
      }

      setUploadProgress(40);
      setUploadStep("PREPARING SUPABASE VAULT & HASHING PAYLOAD...");

      const response = await fetch("/api/intelligence/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(75);
      setUploadStep("TRANSMITTING BYTES TO CLOUD STORAGE...");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || "Upload failed");
      }

      setUploadProgress(100);
      setUploadStep("INGESTION COMPLETE · EVIDENCE LOGGED");

      const result = {
        caseId: data.case.id,
        caseName: data.case.name,
        fileName: data.file.name,
        storagePath: data.file.storagePath,
        size: data.file.size,
      };

      setUploadResult(result);
      if (onSuccess) {
        onSuccess({
          caseId: result.caseId,
          file: {
            name: result.fileName,
            storagePath: result.storagePath,
            size: result.size,
          },
        });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to upload file");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleResetForAnother = () => {
    setFile(null);
    setTitle("");
    setNotes("");
    setUploadResult(null);
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStep("");
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => !isUploading && onClose()}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl border border-white/[0.15] bg-[#0c0d12] text-white font-mono shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Corner Brackets */}
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
        <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[11px] font-bold tracking-widest text-white uppercase">
                INGEST INTELLIGENCE
              </span>
              <span className="text-[9px] text-white/40 block">
                SECURE DATA INGESTION ENGINE // SUPABASE STORAGE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1 text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {uploadResult ? (
            /* ── SUCCESS STATE ── */
            <div className="space-y-5 py-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  INTELLIGENCE STORED SECURELY
                </h3>
                <p className="text-[11px] text-white/50">
                  File successfully verified, encrypted, and written to Supabase Storage.
                </p>
              </div>

              {/* Receipt / Metadata Box */}
              <div className="border border-white/[0.08] bg-white/[0.02] p-4 text-left space-y-2.5 text-[11px]">
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-white/35 text-[9px] uppercase tracking-widest">TARGET CASE</span>
                  <span className="text-emerald-400 font-semibold">{uploadResult.caseId} // {uploadResult.caseName}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                  <span className="text-white/35 text-[9px] uppercase tracking-widest">FILE NAME</span>
                  <span className="text-white/80">{uploadResult.fileName} ({(uploadResult.size / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-white/35 text-[9px] uppercase tracking-widest block">STORAGE VAULT PATH</span>
                  <code className="text-[10px] text-cyan-400/90 break-all bg-black/40 p-2 block border border-cyan-500/20">
                    {uploadResult.storagePath}
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleResetForAnother}
                  className="flex-1 py-2.5 px-4 text-[10px] font-bold tracking-widest uppercase border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  INGEST ANOTHER FILE
                </button>
                <Link
                  href={`/dashboard/cases/${uploadResult.caseId}`}
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 text-[10px] font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 font-mono"
                >
                  VIEW CASE WORKSPACE
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* ── UPLOAD FORM ── */
            <>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Upload FIRs, CDRs, financial records, surveillance reports, and other investigation material directly into the secure cloud repository.
              </p>

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-400 bg-emerald-950/20"
                    : file
                    ? "border-white/30 bg-white/[0.03]"
                    : "border-white/15 bg-white/[0.01] hover:border-white/30 hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.csv,.xlsx,.xls,.txt,.docx,.doc,.json,.png,.jpg,.jpeg"
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="text-[12px] font-semibold text-white truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">
                        {(file.size / 1024).toFixed(1)} KB · Ready to ingest
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto border border-white/15 flex items-center justify-center text-white/40">
                      <Upload className="w-5 h-5 text-white/50 animate-bounce" />
                    </div>
                    <div className="text-[12px] font-bold tracking-widest text-white uppercase">
                      DROP FILES HERE
                    </div>
                    <p className="text-[10px] text-white/40 font-mono">
                      PDF · CSV · XLSX · TXT · DOCX · MEDIA
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1.5 text-[9px] tracking-widest uppercase border border-white/20 text-white/70 bg-white/[0.04]">
                        [ SELECT FILES ]
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase block">
                    SOURCE TYPE
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    disabled={isUploading}
                    className="w-full bg-[#0a0b0e] border border-white/[0.12] px-3 py-2 text-[11px] text-white font-mono focus:border-emerald-400 focus:outline-none"
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#0c0d12] text-white">
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Case Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase block">
                      TARGET CASE FILE
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCase(!isCreatingNewCase)}
                      className="text-[9px] text-emerald-400 hover:underline tracking-widest uppercase flex items-center gap-1"
                    >
                      {isCreatingNewCase ? "← SELECT EXISTING" : "+ CREATE NEW CASE"}
                    </button>
                  </div>

                  {!isCreatingNewCase ? (
                    <select
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      disabled={isUploading || cases.length === 0}
                      className="w-full bg-[#0a0b0e] border border-white/[0.12] px-3 py-2 text-[11px] text-white font-mono focus:border-emerald-400 focus:outline-none"
                    >
                      {cases.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0c0d12] text-white">
                          {c.id} — {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newCaseName}
                      onChange={(e) => setNewCaseName(e.target.value)}
                      placeholder="e.g. Operation Shadow Wire"
                      disabled={isUploading}
                      className="w-full bg-[#0a0b0e] border border-emerald-500/40 px-3 py-2 text-[11px] text-white font-mono placeholder:text-white/20 focus:border-emerald-400 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Extra Case Fields (when creating new case) */}
              {isCreatingNewCase && (
                <div className="grid grid-cols-2 gap-3 p-3 border border-emerald-500/20 bg-emerald-950/10">
                  <div className="space-y-1">
                    <label className="text-[9px] text-emerald-400/80 tracking-widest uppercase block">
                      PRIORITY
                    </label>
                    <select
                      value={newCasePriority}
                      onChange={(e) => setNewCasePriority(e.target.value as "HIGH" | "MEDIUM" | "LOW")}
                      className="w-full bg-[#0a0b0e] border border-white/[0.12] px-2 py-1.5 text-[10px] text-white font-mono focus:outline-none"
                    >
                      <option value="HIGH">HIGH PRIORITY</option>
                      <option value="MEDIUM">MEDIUM PRIORITY</option>
                      <option value="LOW">LOW PRIORITY</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-emerald-400/80 tracking-widest uppercase block">
                      JURISDICTION
                    </label>
                    <input
                      type="text"
                      value={newCaseJurisdiction}
                      onChange={(e) => setNewCaseJurisdiction(e.target.value)}
                      placeholder="e.g. NATIONAL — MH, DL"
                      className="w-full bg-[#0a0b0e] border border-white/[0.12] px-2 py-1.5 text-[10px] text-white font-mono placeholder:text-white/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Document Title & Notes */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase block">
                    DOCUMENT TITLE / IDENTIFIER
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Delhi Cyber Police FIR No. 402/2026"
                    disabled={isUploading}
                    className="w-full bg-[#0a0b0e] border border-white/[0.12] px-3 py-2 text-[11px] text-white font-mono placeholder:text-white/20 focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-white/40 uppercase block">
                    INVESTIGATION NOTES / SOURCE DETAILS
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide context on how evidence was seized, field agent observations, or chain of custody..."
                    disabled={isUploading}
                    className="w-full bg-[#0a0b0e] border border-white/[0.12] px-3 py-2 text-[11px] text-white font-mono placeholder:text-white/20 focus:border-emerald-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Error Message Display */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 border border-red-500/30 bg-red-950/30 text-red-400 text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Uploading Progress Telemetry */}
              {isUploading && (
                <div className="space-y-2 border border-cyan-500/30 bg-cyan-950/20 p-3.5">
                  <div className="flex justify-between text-[10px] text-cyan-400">
                    <span className="tracking-widest uppercase">{uploadStep}</span>
                    <span className="font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!uploadResult && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.08] bg-white/[0.02]">
            <span className="text-[9px] text-white/30 tracking-widest uppercase">
              ENCRYPTED SUPABASE UPLOAD // TLS 1.3
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-[10px] tracking-widest uppercase text-white/50 hover:text-white transition-colors disabled:opacity-30"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || !file}
                className="px-5 py-2 text-[10px] font-bold tracking-widest uppercase bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-all flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    INGESTING...
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3" />
                    INGEST INTELLIGENCE
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
