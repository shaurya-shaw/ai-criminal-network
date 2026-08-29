"use client";

import React from "react";
import GridBackground from "./components/GridBackground";
import EntityNodesWidget from "./components/EntityNodesWidget";
import AuthCard from "./components/AuthCard";
import { HyperText } from "@/frontend/components/ui/hyper-text";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-14 overflow-hidden bg-[#08090c]">
      <GridBackground />

      {/* Main Forensic Outer Container (Transparent Glassmorphic Wireframe Box) */}
      <div className="relative z-10 w-full max-w-6xl border border-white/[0.18] bg-black/65  p-6 sm:p-8 md:p-12 lg:p-16 transition-all duration-300 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {/* Wireframe Style Corner Tick Markings */}
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-white/60 pointer-events-none" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-white/60 pointer-events-none" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-white/60 pointer-events-none" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-white/60 pointer-events-none" />

        <div className="hidden sm:flex absolute -top-3 left-10 px-2 bg-[#090a0d] border border-white/10 text-[9px] font-mono tracking-widest text-white/40 uppercase">
          SECURE TERMINAL // NETWORK_GRAPH_V1
        </div>
        <div className="hidden sm:flex absolute -bottom-3 right-10 px-2 bg-[#090a0d] border border-white/10 text-[9px] font-mono tracking-widest text-white/40 uppercase">
          FORENSIC INTELLIGENCE ENGINE
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch min-h-[520px]">
          <div className="lg:col-span-7 flex flex-col justify-between gap-10 h-full">
            <div className="flex items-center gap-3">
              <div className="w-3 h-5 bg-white shrink-0 animate-cursor-blink shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <span className="text-sm md:text-base font-mono font-bold tracking-[0.3em] text-white uppercase">
                <HyperText>INVESTIGATE</HyperText>
              </span>
              <span className="ml-2 px-2 py-0.5 text-[9px] font-mono tracking-widest text-emerald-400/80 border border-emerald-400/30 uppercase">
                System Live
              </span>
            </div>

            <div className="space-y-5 my-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-mono font-bold tracking-tight text-white leading-[1.12]">
                <span className="block">EVERY CONNECTION</span>
                <span className="block text-white/90">LEAVES</span>
                <span className="block text-white/70">A TRACE.</span>
              </h1>

              <p className="text-sm sm:text-base text-white/60 font-mono max-w-lg leading-relaxed pt-2">
                Fuse fragmented intelligence into a single relationship
                graph—connecting FIRs, communications, financial activity, and
                surveillance to reveal what individual records cannot.
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <EntityNodesWidget />
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <AuthCard />
          </div>
        </div>
      </div>

      <div className="fixed bottom-2 inset-x-0 flex justify-center pointer-events-none z-20">
        <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase">
          RESTRICTED ACCESS // AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
    </main>
  );
}
