"use client";

import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Base Grid */}
      <div className="absolute inset-0 forensic-grid opacity-90" />

      {/* Dense Micro Grid */}
      <div className="absolute inset-0 forensic-grid-dense opacity-55" />

      {/* Sparkles Particle Background */}
      <div className="absolute inset-0 w-full h-full opacity-100">
        <SparklesCore
          id="tsparticles-background"
          background="transparent"
          minSize={0.6}
          maxSize={2.8}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={0.8}
        />
      </div>

      {/* Noise Texture Layer */}
      <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay" />

      {/* Minimal Ambient Glow behind hero & sign-in */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full blur-[140px] opacity-[0.05] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ffffff 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 translate-x-1/2 w-[450px] h-[450px] rounded-full blur-[120px] opacity-[0.06] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #a3b8cc 0%, transparent 70%)",
        }}
      />

      {/* Dark Vignette Overlay with Open Translucent Center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(9,10,13,0.85) 100%)",
        }}
      />

      {/* Forensic Coordinate Labels (Subtle peripheral watermarks) */}
      <div className="absolute top-4 left-6 text-[10px] font-mono tracking-widest text-white/10 uppercase">
        SYS.SEC // 2026.REL.01 // GRID_REF: 44.18N-71.05W
      </div>
      <div className="absolute bottom-4 right-6 text-[10px] font-mono tracking-widest text-white/10 uppercase">
        ENCRYPTED SECURE CHANNEL // AUTH_STATE: AWAIT_INPUT
      </div>
    </div>
  );
}
