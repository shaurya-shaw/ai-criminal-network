"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import GridBackground from "../components/GridBackground";
import {
  ShieldAlert,
  Activity,
  Network,
  Users,
  Terminal,
  Database,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();

  return (
    <main className="relative min-h-screen w-full bg-[#090a0d] text-white p-4 sm:p-6 md:p-10 font-mono overflow-x-hidden">
      {/* Dynamic Grid Background */}
      <GridBackground />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Top Forensic Navigation Bar */}
        <header className="border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-4 bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold tracking-[0.25em] text-white uppercase">
              INVESTIGATE // DASHBOARD
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#171924] border border-white/10 text-[11px] text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                OPERATOR:{" "}
                <strong className="text-white font-semibold">
                  {isLoaded ? user?.primaryEmailAddress?.emailAddress || user?.fullName || "AUTHORIZED" : "AUTHENTICATING..."}
                </strong>
              </span>
            </div>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-none border border-white/30",
                  userButtonPopoverCard:
                    "bg-[#11131a] border border-white/15 rounded-none font-mono text-white shadow-2xl",
                },
              }}
            />
          </div>
        </header>

        {/* Outer Dashboard Terminal Box */}
        <div className="relative border border-white/[0.14] bg-[#0c0d12]/80 backdrop-blur-md p-6 sm:p-8 transition-all duration-300">
          {/* Corner Tick Markings */}
          <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-white/60 pointer-events-none" />
          <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-white/60 pointer-events-none" />
          <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-white/60 pointer-events-none" />
          <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-white/60 pointer-events-none" />

          {/* Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                CRIMINAL NETWORK INTELLIGENCE FEED
              </h1>
              <p className="text-xs text-white/50 font-sans mt-1">
                Real-time node telemetry, multi-hop relationship graphs, and entity forensics.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 self-start">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE RECON ACTIVE</span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#11131a]/90 border border-white/10 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] tracking-widest uppercase">TRACKED ENTITIES</span>
                <Users className="w-4 h-4 text-white/60" />
              </div>
              <div className="text-2xl font-bold text-white">1,482</div>
              <div className="text-[10px] text-emerald-400 mt-1">+14 identified today</div>
            </div>

            <div className="bg-[#11131a]/90 border border-white/10 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] tracking-widest uppercase">NODE CLUSTERS</span>
                <Network className="w-4 h-4 text-white/60" />
              </div>
              <div className="text-2xl font-bold text-white">384</div>
              <div className="text-[10px] text-cyan-400 mt-1">7 cross-border rings</div>
            </div>

            <div className="bg-[#11131a]/90 border border-white/10 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] tracking-widest uppercase">HIGH-RISK ALERTS</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300">29</div>
              <div className="text-[10px] text-amber-400/80 mt-1">Immediate action required</div>
            </div>

            <div className="bg-[#11131a]/90 border border-white/10 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-2">
                <span className="text-[10px] tracking-widest uppercase">DATA SOURCES</span>
                <Database className="w-4 h-4 text-white/60" />
              </div>
              <div className="text-2xl font-bold text-white">18</div>
              <div className="text-[10px] text-white/50 mt-1">Sync latency: 42ms</div>
            </div>
          </div>

          {/* Graph Placeholder & Terminal Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-[#0a0b10] border border-white/[0.08] p-6 min-h-[320px] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ENTITY GRAPH VISUALIZER</span>
                </div>
                <span className="text-[10px] text-white/30">3D FORCE ENGINE</span>
              </div>

              <div className="my-auto py-12 text-center space-y-3">
                <div className="inline-flex p-3 bg-white/5 border border-white/10">
                  <Network className="w-8 h-8 text-white/70 animate-pulse" />
                </div>
                <div className="text-sm font-semibold text-white">
                  GRAPH TOPOLOGY READY
                </div>
                <p className="text-xs text-white/40 max-w-md mx-auto font-sans">
                  Entity relationship canvas initialized for operator investigation. Ready to load case files and surveillance records.
                </p>
              </div>

              <div className="text-[10px] text-white/30 border-t border-white/[0.06] pt-3 flex justify-between">
                <span>CANVAS STATUS: MOUNTED</span>
                <span>GPU ACCELERATION: ACTIVE</span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#0a0b10] border border-white/[0.08] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs text-white/60">
                <span>RECENT LOGS</span>
                <span className="text-emerald-400 text-[10px]">STREAMING</span>
              </div>

              <div className="space-y-3 text-[11px] font-mono text-white/70">
                <div className="p-2 bg-white/[0.02] border-l-2 border-emerald-400">
                  <div className="text-white/40 text-[9px]">12:44:02 UTC</div>
                  <div>OAuth credentials verified via Google provider.</div>
                </div>
                <div className="p-2 bg-white/[0.02] border-l-2 border-cyan-400">
                  <div className="text-white/40 text-[9px]">12:44:03 UTC</div>
                  <div>Session token minted with biometric clearance.</div>
                </div>
                <div className="p-2 bg-white/[0.02] border-l-2 border-amber-400">
                  <div className="text-white/40 text-[9px]">12:44:05 UTC</div>
                  <div>Connecting to criminal node surveillance feed...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
