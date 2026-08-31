"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertCircle, PlusCircle } from "lucide-react";
import type { CaseDetail } from "../data";
import { caseNavSections } from "./components/constants";
import CaseHeaderBanner from "./components/CaseHeaderBanner";
import CaseStickySubNav from "./components/CaseStickySubNav";
import CaseSummarySection from "./components/CaseSummarySection";
import CaseNetworkGraphSection from "./components/CaseNetworkGraphSection";
import CaseEntitiesSection from "./components/CaseEntitiesSection";
import CaseTimelineSection from "./components/CaseTimelineSection";
import CaseEvidenceSection from "./components/CaseEvidenceSection";
import CaseAlertsSection from "./components/CaseAlertsSection";
import CaseAIInvestigatorSection from "./components/CaseAIInvestigatorSection";

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = (params?.caseId as string) || "";

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("summary");

  const fetchCaseDetail = useCallback(async () => {
    if (!caseId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setCaseData(data);
        } else {
          setError(`Case '${caseId}' not found.`);
        }
      } else {
        setError(`Case '${caseId}' not found in active records.`);
      }
    } catch (err) {
      console.warn("Could not fetch case from API:", err);
      setError("Network or server connection error.");
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCaseDetail();
  }, [fetchCaseDetail]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    caseNavSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // ── Loading Skeleton ──
  if (isLoading && !caseData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Link
          href="/dashboard/cases"
          className="flex items-center gap-2 text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO CASES
        </Link>
        <div className="border border-white/[0.1] bg-[#0c0d12]/80 p-16 text-center relative">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-3" />
          <div className="text-white/60 font-mono text-[11px] tracking-widest uppercase mb-1">
            RETRIEVING FORENSIC CASE DOSSIER...
          </div>
          <div className="text-[10px] font-mono text-white/30">
            Querying intelligence records for {caseId}
          </div>
        </div>
      </div>
    );
  }

  // ── 404 / Error State ──
  if (!caseData || error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Link
          href="/dashboard/cases"
          className="flex items-center gap-2 text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO CASES
        </Link>
        <div className="border border-white/[0.1] bg-[#0c0d12]/80 p-12 text-center relative space-y-4">
          <div className="w-10 h-10 rounded-full border border-red-500/30 bg-red-950/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white">CASE FILE NOT FOUND</div>
            <p className="text-[11px] font-mono text-white/40 max-w-md mx-auto">
              {error || `Case '${caseId}' could not be located in database records.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={fetchCaseDetail}
              className="px-3 py-1.5 border border-white/10 text-white/60 font-mono text-[10px] hover:bg-white/[0.04] transition-colors"
            >
              Retry Query
            </button>
            <Link
              href="/dashboard/data-sources"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] hover:bg-cyan-500/20 transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              Ingest Document
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/cases"
        className="flex items-center gap-2 text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK TO CASES
      </Link>

      {/* 1. Header Banner */}
      <CaseHeaderBanner caseData={caseData} />

      {/* 2. Sticky Sub-Navigation */}
      <CaseStickySubNav
        activeSection={activeSection}
        onSelectSection={scrollToSection}
      />

      {/* 3. Case Summary */}
      <CaseSummarySection
        caseData={caseData}
        onNavigateToAI={() => scrollToSection("ai-investigator")}
      />


      {/* 4. Network Graph */}
      <CaseNetworkGraphSection caseData={caseData} />

      {/* 5. Entities List */}
      <CaseEntitiesSection caseData={caseData} />

      {/* 6. Timeline */}
      <CaseTimelineSection caseData={caseData} />

      {/* 7. Evidence */}
      <CaseEvidenceSection caseData={caseData} />

      {/* 8. Alerts */}
      <CaseAlertsSection caseData={caseData} />

      {/* 9. AI Investigator Chat */}
      <CaseAIInvestigatorSection caseData={caseData} />

      {/* Footer classification banner */}
      <div className="border border-white/[0.06] bg-[#0c0d12]/40 px-4 py-2.5 flex items-center justify-between text-[9px] font-mono text-white/20 uppercase tracking-widest">
        <span>SECURITY: {caseData.classification}</span>
        <span>NATIONAL CRIMINAL FORENSICS DATABASE // RESTRICTED ACCESS</span>
      </div>
    </div>
  );
}
