"use client";

import React from "react";
import { Settings } from "lucide-react";
import TerminalCard from "../components/TerminalCard";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Intelligence / Settings</span>
        </div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">Settings</h1>
        <p className="text-[11px] text-white/40 font-mono mt-0.5">System preferences and operator configuration</p>
      </div>

      <TerminalCard title="SYSTEM PREFERENCES">
        <div className="space-y-4">
          {[
            { label: "Alert Notifications", desc: "Receive real-time alerts for high-risk events", value: true },
            { label: "Auto-sync Data Sources", desc: "Automatically sync all connected feeds every 5 minutes", value: true },
            { label: "Cross-case Entity Matching", desc: "Automatically link entities that appear across multiple cases", value: true },
            { label: "Session Timeout (30 min)", desc: "Auto-logout after 30 minutes of inactivity", value: false },
          ].map((setting) => (
            <div key={setting.label} className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.06] last:border-0 last:pb-0">
              <div>
                <div className="text-[12px] font-semibold text-white">{setting.label}</div>
                <div className="text-[10px] font-mono text-white/35 mt-0.5">{setting.desc}</div>
              </div>
              <div className={`shrink-0 px-2 py-0.5 text-[9px] font-mono border cursor-pointer transition-colors ${
                setting.value
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/30"
                  : "text-white/30 border-white/10 bg-white/5"
              }`}>
                {setting.value ? "ENABLED" : "DISABLED"}
              </div>
            </div>
          ))}
        </div>
      </TerminalCard>

      <TerminalCard title="OPERATOR PROFILE">
        <div className="space-y-3 text-[11px] font-mono">
          {[
            { label: "CLEARANCE LEVEL", value: "LEVEL 3 — RESTRICTED" },
            { label: "ACCESS ROLE", value: "LEAD INVESTIGATOR" },
            { label: "JURISDICTION", value: "NATIONAL — ALL ZONES" },
            { label: "SESSION TOKEN", value: "SYS-TOKEN-••••••••••••" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
              <span className="text-white/35 tracking-widest text-[10px]">{row.label}</span>
              <span className="text-white/70">{row.value}</span>
            </div>
          ))}
        </div>
      </TerminalCard>

      <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase border-t border-white/[0.06] pt-3">
        SYSTEM CONFIGURATION // FORENSIC INTELLIGENCE ENGINE
      </div>
    </div>
  );
}
