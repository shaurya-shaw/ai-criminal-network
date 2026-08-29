import React from "react";

interface SectionHeadingProps {
  label: string;
  count?: number;
}

export default function SectionHeading({ label, count }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-4 bg-emerald-400" />
      <h2 className="text-[11px] font-mono font-bold tracking-widest text-white uppercase">
        {label}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-white/30 border border-white/10 px-1.5 py-px">
          {count}
        </span>
      )}
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}
