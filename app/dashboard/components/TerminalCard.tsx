"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TerminalCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleRight?: React.ReactNode;
  statusLabel?: string;
  statusColor?: "emerald" | "amber" | "cyan" | "red" | "white";
  noPadding?: boolean;
}

const statusColorMap: Record<string, string> = {
  emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
  amber: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
  red: "text-red-400 border-red-500/30 bg-red-950/40",
  white: "text-white/60 border-white/10 bg-white/5",
};

const dotColorMap: Record<string, string> = {
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  cyan: "bg-cyan-400",
  red: "bg-red-400",
  white: "bg-white/60",
};

export default function TerminalCard({
  children,
  className,
  title,
  titleRight,
  statusLabel,
  statusColor = "emerald",
  noPadding = false,
}: TerminalCardProps) {
  return (
    <div
      className={cn(
        "relative border border-white/[0.1] bg-[#0c0d12]/80 backdrop-blur-md transition-all duration-200",
        !noPadding && "p-5 sm:p-6",
        className
      )}
    >
      {/* Corner bracket markings */}
      <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-white/50 pointer-events-none" />
      <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-white/50 pointer-events-none" />
      <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-white/50 pointer-events-none" />
      <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-white/50 pointer-events-none" />

      {/* Header */}
      {(title || titleRight || statusLabel) && (
        <div
          className={cn(
            "flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4",
            noPadding && "px-5 sm:px-6 pt-5 sm:pt-6"
          )}
        >
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-[11px] font-mono font-semibold tracking-widest text-white/70 uppercase">
                {title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {statusLabel && (
              <span
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-mono tracking-widest border px-2 py-0.5 uppercase",
                  statusColorMap[statusColor]
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    dotColorMap[statusColor]
                  )}
                />
                {statusLabel}
              </span>
            )}
            {titleRight}
          </div>
        </div>
      )}

      <div className={cn(noPadding && "px-5 sm:px-6 pb-5 sm:pb-6")}>
        {children}
      </div>
    </div>
  );
}
