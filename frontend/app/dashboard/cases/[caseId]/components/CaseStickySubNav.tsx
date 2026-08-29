import React from "react";
import { caseNavSections } from "./constants";

interface CaseStickySubNavProps {
  activeSection: string;
  onSelectSection: (id: string) => void;
}

export default function CaseStickySubNav({
  activeSection,
  onSelectSection,
}: CaseStickySubNavProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.1] bg-[#090a0d]/95 backdrop-blur-md">
      <div className="flex items-center overflow-x-auto">
        {caseNavSections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSection(s.id)}
            className={`px-4 py-3 text-[10px] font-mono tracking-widest uppercase whitespace-nowrap transition-colors border-b-2 ${
              activeSection === s.id
                ? "text-white border-emerald-400"
                : "text-white/35 border-transparent hover:text-white/60 hover:border-white/20"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
