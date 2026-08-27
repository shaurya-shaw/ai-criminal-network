"use client";

import React from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import GridBackground from "../components/GridBackground";
import EntityNodesWidget from "../components/EntityNodesWidget";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-14 overflow-hidden">
      {/* Dynamic Grid Background with Noise, Vignette & Sparkles */}
      <GridBackground />

      {/* Main Forensic Outer Container (Matches Wireframe Border Box) */}
      <div className="relative z-10 w-full max-w-6xl border border-white/[0.14] bg-[#0c0d12]/80 backdrop-blur-md p-6 sm:p-8 md:p-12 lg:p-16 transition-all duration-300 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Wireframe Style Corner Tick Markings */}
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-white/60 pointer-events-none" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-white/60 pointer-events-none" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-white/60 pointer-events-none" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-white/60 pointer-events-none" />

        {/* Subtle Decorative Technical Metadata on Border */}
        <div className="hidden sm:flex absolute -top-3 left-10 px-2 bg-[#090a0d] border border-white/10 text-[9px] font-mono tracking-widest text-white/40 uppercase">
          SECURE HANDSHAKE // SSO_CALLBACK
        </div>
        <div className="hidden sm:flex absolute -bottom-3 right-10 px-2 bg-[#090a0d] border border-white/10 text-[9px] font-mono tracking-widest text-white/40 uppercase">
          VERIFYING IDENTITY CREDENTIALS
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center min-h-[520px]">
          
          {/* Left Column: Branding, Statement, and Entity Node Diagram */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-10 lg:space-y-12">
            
            {/* Top Branding Pill */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-5 bg-white shrink-0 animate-cursor-blink shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <span className="text-sm md:text-base font-mono font-bold tracking-[0.3em] text-white uppercase">
                INVESTIGATE
              </span>
            </div>

            {/* Middle Hero Section */}
            <div className="space-y-5 my-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-mono font-bold tracking-tight text-white leading-[1.12]">
                <span className="block">AUTHENTICATING</span>
                <span className="block text-white/90">OPERATOR</span>
                <span className="block text-white/70">CLEARANCE.</span>
              </h1>

              <p className="text-sm sm:text-base text-white/60 font-sans max-w-lg leading-relaxed pt-2">
                Completing secure cryptographic handshake with Google OAuth provider. Establishing session token...
              </p>
            </div>

            {/* Bottom Section: Entity Connection Widget */}
            <div className="pt-4 border-t border-white/[0.08]">
              <EntityNodesWidget />
            </div>

          </div>

          {/* Right Column: High-tech Forensic Loading Terminal */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm bg-[#11131a]/95 backdrop-blur-md border border-white/[0.12] p-7 md:p-8 rounded-none shadow-2xl overflow-hidden font-mono text-white">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 corner-bracket-tl pointer-events-none" />
              <div className="absolute top-0 right-0 w-2 h-2 corner-bracket-tr pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-2 h-2 corner-bracket-bl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-2 h-2 corner-bracket-br pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono tracking-[0.25em] text-white/80 font-semibold uppercase">
                    SSO HANDSHAKE
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">
                  OAUTH // 2.0
                </span>
              </div>

              {/* Visual Scanner Box */}
              <div className="relative py-8 flex flex-col items-center justify-center space-y-4 border border-white/[0.06] bg-[#0d0e14]/60 my-4">
                <div className="relative">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 rounded-full border border-emerald-400/30 animate-ping pointer-events-none" />
                </div>
                
                <div className="text-center space-y-1">
                  <div className="text-xs font-mono font-semibold tracking-wider text-white">
                    SYNCHRONIZING PROFILE
                  </div>
                  <div className="text-[10px] font-mono text-white/40 tracking-widest uppercase">
                    RESOLVING JWT SESSION
                  </div>
                </div>

                {/* Progress bar animation */}
                <div className="w-44 h-1 bg-white/10 overflow-hidden relative">
                  <div className="h-full bg-emerald-400 w-1/2 animate-[pulse_1s_ease-in-out_infinite]" />
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/30">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SECURE SSL LINK</span>
                </div>
                <span>CLERK PROTOCOL</span>
              </div>

              {/* Embedded Clerk Callback handler */}
              <div className="sr-only">
                <AuthenticateWithRedirectCallback
                  continueSignUpUrl="/sign-up"
                  signInForceRedirectUrl="/dashboard"
                  signUpForceRedirectUrl="/dashboard"
                  signInFallbackRedirectUrl="/dashboard"
                  signUpFallbackRedirectUrl="/dashboard"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer System Status Bar */}
      <div className="fixed bottom-2 inset-x-0 flex justify-center pointer-events-none z-20">
        <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase">
          CLASSIFIED CRIMINAL RECONNAISSANCE SYSTEM // AUTHORIZING CREDENTIALS
        </div>
      </div>
    </main>
  );
}
