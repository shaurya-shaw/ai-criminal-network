"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";

export default function TopBar() {
  const { user, isLoaded } = useUser();

  return (
    <header className="h-14 border-b border-white/[0.1] bg-[#0b0c10]/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 gap-4 shrink-0">
      {/* Left: status indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-3.5 bg-emerald-400 animate-pulse" />
        <span className="hidden sm:block text-[10px] font-mono tracking-[0.2em] text-white/50 uppercase">
          SECURE TERMINAL // NETWORK_GRAPH_V1
        </span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white/40 text-[11px] font-mono">
          <Search className="w-3 h-3 shrink-0" />
          <span className="hidden sm:block">Search entities, cases, networks...</span>
          <span className="sm:hidden">Search...</span>
          <span className="ml-auto hidden sm:block border border-white/10 px-1 text-[9px] text-white/20">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: operator + notifications + user */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification bell */}
        <div className="relative p-1.5 text-white/40 hover:text-white/70 transition-colors cursor-pointer">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-[#0b0c10]" />
        </div>

        {/* Operator badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-[#171924] border border-white/[0.08] text-[10px] font-mono text-white/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>
            OPERATOR:{" "}
            <strong className="text-white font-semibold">
              {isLoaded
                ? user?.primaryEmailAddress?.emailAddress?.split("@")[0].toUpperCase() ||
                  user?.fullName?.toUpperCase() ||
                  "AUTHORIZED"
                : "AUTH..."}
            </strong>
          </span>
        </div>

        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7 rounded-none border border-white/30",
              userButtonPopoverCard:
                "bg-[#11131a] border border-white/15 rounded-none font-mono text-white shadow-2xl",
            },
          }}
        />
      </div>
    </header>
  );
}
