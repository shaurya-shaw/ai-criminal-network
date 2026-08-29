"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCaseById } from "../data";
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
  const caseId = params?.caseId as string;
  const caseData = getCaseById(caseId);

  const [activeSection, setActiveSection] = useState("summary");

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

  // ── Case Not Found ──
  if (!caseData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Link
          href="/dashboard/cases"
          className="flex items-center gap-2 text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO CASES
        </Link>
        <div className="border border-white/[0.1] bg-[#0c0d12]/80 p-12 text-center relative">
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-white/40" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-white/40" />
          <div className="text-white/25 font-mono text-[11px] tracking-widest uppercase mb-2">
            CASE NOT FOUND
          </div>
          <div className="text-[10px] font-mono text-white/20">
            {caseId} — no record matches this identifier
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-0">
      {/* Back link */}
      <Link
        href="/dashboard/cases"
        className="flex items-center gap-2 text-[11px] font-mono text-white/40 hover:text-white/70 transition-colors w-fit mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK TO CASES
      </Link>

      {/* Case Header Banner */}
      <CaseHeaderBanner caseData={caseData} />

      {/* Sticky Sub-Nav */}
      <CaseStickySubNav
        activeSection={activeSection}
        onSelectSection={scrollToSection}
      />

      {/* Main Sections */}
      <div className="space-y-8 pt-8">
        <CaseSummarySection
          caseData={caseData}
          onNavigateToAI={() => scrollToSection("ai")}
        />

        <CaseNetworkGraphSection caseData={caseData} />

        <CaseEntitiesSection caseData={caseData} />

        <CaseTimelineSection caseData={caseData} />

        <CaseEvidenceSection caseData={caseData} />

        <CaseAlertsSection caseData={caseData} />

        <CaseAIInvestigatorSection caseData={caseData} />

        {/* Footer */}
        <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-4 flex justify-between pb-4">
          <span>{caseData.id} // FORENSIC INTELLIGENCE ENGINE</span>
          <span>RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY</span>
        </div>
      </div>
    </div>
  );
}
