import React from "react";
import type { CaseDetail } from "../../data";
import SectionHeading from "./SectionHeading";
import { timelineTypeConfig } from "./constants";

interface CaseTimelineSectionProps {
  caseData: CaseDetail;
}

export default function CaseTimelineSection({
  caseData,
}: CaseTimelineSectionProps) {
  const events = caseData.timeline || [];

  return (
    <section id="timeline" className="scroll-mt-24 space-y-4">
      <SectionHeading label="Case Timeline" count={events.length} />

      {events.length === 0 ? (
        <div className="border border-white/[0.09] bg-[#0c0d12]/80 p-8 text-center text-white/35 font-mono text-[10px] uppercase tracking-widest">
          No chronological timeline events logged in case file yet.
        </div>
      ) : (
        <div className="relative">
          {/* Central line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.08] transform -translate-x-1/2 hidden lg:block" />

          <div className="space-y-6">
            {events.map((event, i) => {
              const cfg = timelineTypeConfig[event.type] || timelineTypeConfig.INTEL;
              const isLeft = i % 2 === 0;

              return (
                <div
                  key={event.id}
                  className="relative lg:grid lg:grid-cols-2 lg:gap-8"
                >
                  {/* Left side content */}
                  <div
                    className={`${isLeft ? "lg:pr-10 lg:text-right" : "lg:col-start-2 lg:pl-10"}`}
                  >
                    <div
                      className={`border border-white/[0.09] bg-[#0c0d12]/80 p-4 relative ${
                        isLeft ? "lg:ml-0" : ""
                      }`}
                    >
                      <div className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t border-l border-white/35" />
                      <div className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b border-r border-white/35" />

                      <div
                        className={`flex items-start gap-2 mb-2 ${isLeft ? "lg:flex-row-reverse" : ""}`}
                      >
                        <span
                          className={`text-[9px] font-mono border px-1.5 py-px shrink-0 ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-mono text-white/30 shrink-0">
                          {event.timestamp}
                        </span>
                      </div>

                      <div className={`${isLeft ? "lg:text-right" : ""}`}>
                        <div className="text-[13px] font-semibold text-white mb-1">
                          {event.title}
                        </div>
                        <p className="text-[11px] font-mono text-white/45 leading-relaxed">
                          {event.description}
                        </p>
                        {event.relatedEntities &&
                          event.relatedEntities.length > 0 && (
                            <div
                              className={`flex flex-wrap gap-1.5 mt-2 ${isLeft ? "lg:justify-end" : ""}`}
                            >
                              {event.relatedEntities.map((eid) => (
                                <span
                                  key={eid}
                                  className="text-[9px] font-mono text-white/30 border border-white/10 px-1.5 py-px"
                                >
                                  {eid}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Center dot — only on lg */}
                  <div className="hidden lg:flex absolute left-1/2 top-4 -translate-x-1/2 items-center justify-center z-10">
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-[#090a0d] ${cfg.dotColor}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

