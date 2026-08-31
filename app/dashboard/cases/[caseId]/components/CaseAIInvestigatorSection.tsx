import React, { useState } from "react";
import { Send } from "lucide-react";
import type { CaseDetail } from "../../data";
import SectionHeading from "./SectionHeading";
import { aiQuickActions } from "./constants";

interface CaseAIInvestigatorSectionProps {
  caseData: CaseDetail;
}

export default function CaseAIInvestigatorSection({
  caseData,
}: CaseAIInvestigatorSectionProps) {
  const [chatInput, setChatInput] = useState("");

  return (
    <section id="ai" className="scroll-mt-24 space-y-4">
      <SectionHeading label="AI Investigator" />

      <div className="border border-cyan-500/20 bg-[#0b0d12]/90 relative">
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-cyan-400/50" />
        <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t border-r border-cyan-400/50" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b border-l border-cyan-400/50" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-cyan-400/50" />

        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/15">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-cyan-400/80 uppercase">
              AI Investigator // FORENSIC LLM
            </span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/20 px-2 py-0.5 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        {/* Chat messages */}
        <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
          {/* System greeting */}
          <div className="text-center text-[10px] font-mono text-white/20 tracking-widest py-2">
            — SESSION STARTED · {caseData.id} · SECURE CHANNEL —
          </div>

          {caseData.aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 shrink-0 border flex items-center justify-center text-[9px] font-mono font-bold ${
                  msg.role === "ai"
                    ? "border-cyan-500/30 bg-cyan-950/40 text-cyan-400"
                    : "border-white/15 bg-white/5 text-white/40"
                }`}
              >
                {msg.role === "ai" ? "AI" : "OP"}
              </div>

              {/* Bubble */}
              <div
                className={`flex-1 max-w-[85%] border p-3.5 ${
                  msg.role === "ai"
                    ? "border-cyan-500/15 bg-cyan-950/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="text-[10px] font-mono text-white/25 mb-2 flex items-center gap-2">
                  <span>
                    {msg.role === "ai" ? "AI INVESTIGATOR" : "OPERATOR"}
                  </span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="text-[11px] font-mono text-white/70 leading-relaxed whitespace-pre-line">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-white/[0.05] pt-3">
          {aiQuickActions.map((action) => (
            <button
              key={action}
              onClick={() => setChatInput(action)}
              className="text-[10px] font-mono text-white/40 border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 hover:text-white/70 hover:border-white/20 hover:bg-white/[0.04] transition-all"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-0 border-t border-cyan-500/15">
          <span className="px-4 text-[12px] font-mono text-cyan-400/50 shrink-0 select-none">
            &gt;_
          </span>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask the AI investigator about this case..."
            className="flex-1 bg-transparent py-4 text-[11px] font-mono text-white/70 placeholder:text-white/20 outline-none"
          />
          <button
            className="px-4 py-4 text-cyan-400/50 hover:text-cyan-400 transition-colors shrink-0"
            onClick={() => setChatInput("")}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
