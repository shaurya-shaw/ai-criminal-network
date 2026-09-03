import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Loader2, Sparkles, Terminal } from "lucide-react";
import type { CaseDetail, AIMessage } from "../../data";
import SectionHeading from "./SectionHeading";
import { aiQuickActions } from "./constants";

interface CaseAIInvestigatorSectionProps {
  caseData: CaseDetail;
}

export default function CaseAIInvestigatorSection({
  caseData,
}: CaseAIInvestigatorSectionProps) {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>(caseData.aiMessages || []);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync initial messages when caseData updates
  useEffect(() => {
    if (caseData.aiMessages && caseData.aiMessages.length > 0) {
      setMessages((prev) => {
        // Keep new user/ai messages if already present
        if (prev.length > caseData.aiMessages.length) return prev;
        return caseData.aiMessages;
      });
    }
  }, [caseData.aiMessages]);

  // Auto-scroll to bottom on new messages or stream chunks
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isStreaming, scrollToBottom]);

  // Index known entities & key forensic locations for clean monospace highlighting
  const knownTerms = useMemo(() => {
    const terms = new Set<string>();
    if (caseData.entities) {
      caseData.entities.forEach((e) => {
        if (e.name && e.name.trim().length > 2) terms.add(e.name.trim());
        if (e.alias && e.alias.trim().length > 2) {
          e.alias.split(",").forEach((a) => {
            const clean = a.trim();
            if (clean.length > 2) terms.add(clean);
          });
        }
      });
    }
    // Common case locations or terms from brief
    const extra = ["Meridian Warehouse", "Meridian Ledger Services", "Meridian Café", "Operation Black Web"];
    extra.forEach((t) => terms.add(t));
    return Array.from(terms).sort((a, b) => b.length - a.length);
  }, [caseData]);

  // Highlighter that renders clean forensic monospace with entity/event tags
  const renderHighlightedContent = (text: string) => {
    if (!text) return null;
    if (knownTerms.length === 0) {
      return <span>{text}</span>;
    }

    // Escape regex characters
    const escapedTerms = knownTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escapedTerms.join("|")}|\\b\\d{1,2}:\\d{2}\\b|no direct recorded connection|no recorded connection)`, "gi");

    const parts = text.split(regex);

    return parts.map((part, idx) => {
      const lower = part.toLowerCase();
      const isEntity = knownTerms.some((t) => t.toLowerCase() === lower);
      const isTime = /^\d{1,2}:\d{2}$/.test(part);
      const isNegativeProof = lower.includes("no direct recorded connection") || lower.includes("no recorded connection");

      if (isEntity) {
        return (
          <span
            key={idx}
            className="text-cyan-300 font-semibold bg-cyan-950/40 px-1 py-0.5 border border-cyan-500/25 rounded-xs inline-block my-0.5"
          >
            {part}
          </span>
        );
      }
      if (isTime) {
        return (
          <span
            key={idx}
            className="text-amber-300/90 font-mono font-medium px-0.5"
          >
            {part}
          </span>
        );
      }
      if (isNegativeProof) {
        return (
          <span
            key={idx}
            className="text-rose-400 font-medium underline decoration-rose-500/40 underline-offset-2"
          >
            {part}
          </span>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : chatInput).trim();
    if (!query || isStreaming) return;

    setChatInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Optimistic user message in UI
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const tempUserMsg: AIMessage = {
      id: `temp-u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch(`/api/cases/${caseData.id}/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream received from forensic investigator");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep unfinished trailing line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                accumulatedResponse += data.chunk;
                setStreamingContent(accumulatedResponse);
              }
              if (data.done) {
                const finalAI: AIMessage = data.aiMessage || {
                  id: `M-${Date.now()}`,
                  role: "ai",
                  content: accumulatedResponse,
                  timestamp: timeStr,
                };
                setMessages((prev) => [...prev, finalAI]);
                setStreamingContent("");
                setIsStreaming(false);
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (pErr) {
              console.warn("SSE parse note:", pErr);
            }
          }
        }
      }

      // If finished stream without explicit done event
      if (accumulatedResponse && isStreaming) {
        const finalAI: AIMessage = {
          id: `M-${Date.now()}`,
          role: "ai",
          content: accumulatedResponse,
          timestamp: timeStr,
        };
        setMessages((prev) => [...prev, finalAI]);
        setStreamingContent("");
        setIsStreaming(false);
      }
    } catch (err) {
      console.error("AI Investigator query failed:", err);
      const errorMsg: AIMessage = {
        id: `err-${Date.now()}`,
        role: "ai",
        content: `FORENSIC QUERY ERROR: ${err instanceof Error ? err.message : "Unable to reach investigation engine."} Verify connection to case intelligence server.`,
        timestamp: timeStr,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setStreamingContent("");
      setIsStreaming(false);
    }
  };

  return (
    <section id="ai" className="scroll-mt-24 space-y-4">
      <SectionHeading label="AI Investigator" />

      <div className="border border-cyan-500/20 bg-[#0b0d12]/90 relative shadow-[0_0_20px_rgba(6,182,212,0.05)]">
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-cyan-400/50" />
        <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t border-r border-cyan-400/50" />
        <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b border-l border-cyan-400/50" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-cyan-400/50" />

        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/15 bg-black/40">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono tracking-widest text-cyan-400/90 uppercase font-semibold">
              AI Investigator // GROUNDED FORENSIC LLM
            </span>
            <span className="text-[9px] font-mono text-white/30 border border-white/10 px-1.5 py-0.5 uppercase">
              SINGLE-TURN GROUNDING
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isStreaming && (
              <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-1.5 animate-pulse">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                CORRELATING TOPOLOGY...
              </span>
            )}
            <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/20 px-2 py-0.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>

        {/* Chat messages */}
        <div
          ref={chatContainerRef}
          className="p-5 space-y-4 max-h-[500px] overflow-y-auto font-mono scrollbar-thin scrollbar-thumb-cyan-500/20"
        >
          {/* System greeting banner */}
          <div className="text-center text-[10px] font-mono text-white/25 tracking-widest py-2 border-b border-white/[0.04]">
            — SESSION STARTED · {caseData.id} · SECURE CHANNEL // FACTUAL CLAIMS ONLY —
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 shrink-0 border flex items-center justify-center text-[9px] font-mono font-bold select-none ${
                  msg.role === "ai"
                    ? "border-cyan-500/30 bg-cyan-950/40 text-cyan-400"
                    : "border-white/15 bg-white/5 text-white/60"
                }`}
              >
                {msg.role === "ai" ? "AI" : "OP"}
              </div>

              {/* Bubble */}
              <div
                className={`flex-1 max-w-[85%] border p-3.5 transition-all ${
                  msg.role === "ai"
                    ? "border-cyan-500/20 bg-cyan-950/15 shadow-[inset_0_1px_0_rgba(6,182,212,0.1)]"
                    : "border-white/15 bg-white/[0.04]"
                }`}
              >
                <div className="text-[10px] font-mono text-white/30 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={msg.role === "ai" ? "text-cyan-400/90 font-medium" : "text-white/60"}>
                      {msg.role === "ai" ? "AI INVESTIGATOR" : "OPERATOR"}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  {msg.role === "ai" && (
                    <span className="text-[8px] tracking-widest text-cyan-500/50 border border-cyan-500/20 px-1 py-0.2">
                      VERIFIED DATA
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-white/80 leading-relaxed whitespace-pre-line break-words">
                  {renderHighlightedContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {/* Active Streaming Message */}
          {isStreaming && streamingContent && (
            <div className="flex gap-3">
              <div className="w-7 h-7 shrink-0 border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 flex items-center justify-center text-[9px] font-mono font-bold animate-pulse">
                AI
              </div>
              <div className="flex-1 max-w-[85%] border border-cyan-500/30 bg-cyan-950/20 p-3.5">
                <div className="text-[10px] font-mono text-cyan-400/80 mb-2 flex items-center gap-2">
                  <span className="font-semibold">AI INVESTIGATOR</span>
                  <span>·</span>
                  <span className="text-[9px] text-cyan-400 animate-pulse">STREAMING EVIDENCE...</span>
                </div>
                <div className="text-[11px] font-mono text-white/90 leading-relaxed whitespace-pre-line">
                  {renderHighlightedContent(streamingContent)}
                  <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1 translate-y-0.5 animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Thinking indicator when request is sent but first chunk hasn't arrived */}
          {isStreaming && !streamingContent && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 shrink-0 border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 flex items-center justify-center text-[9px] font-mono font-bold">
                AI
              </div>
              <div className="border border-cyan-500/15 bg-cyan-950/10 px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="text-[10px] font-mono text-cyan-300/70 tracking-wider uppercase">
                  CROSS-REFERENCING CASE GRAPH & TIMELINE...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-white/[0.05] pt-3 bg-black/20">
          <div className="w-full text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400/60" />
            SUGGESTED INVESTIGATIVE QUERIES:
          </div>
          {aiQuickActions.map((action) => (
            <button
              key={action}
              disabled={isStreaming}
              onClick={() => {
                setChatInput(action);
                handleSendMessage(action);
              }}
              className="text-[10px] font-mono text-white/45 border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 hover:text-cyan-300 hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left cursor-pointer"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-0 border-t border-cyan-500/15 bg-black/40">
          <span className="px-4 text-[12px] font-mono text-cyan-400/70 shrink-0 select-none">
            &gt;_
          </span>
          <input
            type="text"
            value={chatInput}
            disabled={isStreaming}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              isStreaming
                ? "AI Investigator is analyzing case topology..."
                : "Ask the AI investigator (e.g. 'Does Diana Holt have a connection to Meridian Warehouse?')..."
            }
            className="flex-1 bg-transparent py-4 text-[11px] font-mono text-white/80 placeholder:text-white/20 outline-none disabled:opacity-50"
          />
          <button
            disabled={isStreaming || !chatInput.trim()}
            className="px-4 py-4 text-cyan-400/70 hover:text-cyan-300 disabled:text-white/20 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
            onClick={() => handleSendMessage()}
          >
            {isStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
