"use client";

import React from "react";
import { SignUp } from "@clerk/nextjs";
import GridBackground from "../../components/GridBackground";
import EntityNodesWidget from "../../components/EntityNodesWidget";

export default function SignUpPage() {
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
          OPERATOR CLEARANCE // REGISTRATION
        </div>
        <div className="hidden sm:flex absolute -bottom-3 right-10 px-2 bg-[#090a0d] border border-white/10 text-[9px] font-mono tracking-widest text-white/40 uppercase">
          SECURE CREDENTIAL ENROLLMENT
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
                <span className="block">INTELLIGENCE</span>
                <span className="block text-white/90">WITHOUT</span>
                <span className="block text-white/70">THE NOISE.</span>
              </h1>

              <p className="text-sm sm:text-base text-white/60 font-sans max-w-lg leading-relaxed pt-2">
                Register new operator credentials to initialize forensic node analytics and intelligence tracking.
              </p>
            </div>

            {/* Bottom Section: Entity Connection Widget */}
            <div className="pt-4 border-t border-white/[0.08]">
              <EntityNodesWidget />
            </div>

          </div>

          {/* Right Column: Embedded Forensic Clerk SignUp */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/dashboard"
                forceRedirectUrl="/dashboard"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Footer System Status Bar */}
      <div className="fixed bottom-2 inset-x-0 flex justify-center pointer-events-none z-20">
        <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase">
          CLASSIFIED CRIMINAL RECONNAISSANCE SYSTEM // CLERK SECURED
        </div>
      </div>
    </main>
  );
}
