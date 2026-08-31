import type { CaseDetail } from "../../data";
import InvestigationGraph from "@/app/dashboard/components/InvestigationGraph";
import SectionHeading from "./SectionHeading";

interface CaseNetworkGraphSectionProps {
  caseData: CaseDetail;
}

export default function CaseNetworkGraphSection({ caseData }: CaseNetworkGraphSectionProps) {
  return (
    <section id="graph" className="scroll-mt-24 space-y-4">
      <SectionHeading label="Network Graph" />
      <div className="relative overflow-hidden border border-white/[0.1] bg-[#0c0d12]/80">
        <div className="absolute -left-px -top-px z-10 h-3 w-3 border-l border-t border-white/40" />
        <div className="absolute -right-px -top-px z-10 h-3 w-3 border-r border-t border-white/40" />
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Entity Graph Visualizer</span>
          <span className="border border-cyan-500/20 bg-cyan-950/20 px-2 py-0.5 text-[9px] font-mono text-cyan-400/70">NEO4J · LIVE</span>
        </div>
        <InvestigationGraph caseId={caseData.id} />
      </div>
    </section>
  );
}
