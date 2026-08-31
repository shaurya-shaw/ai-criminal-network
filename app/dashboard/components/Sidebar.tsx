"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Network,
  Users,
  ShieldAlert,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from "lucide-react";

const navItems = [
  {
    label: "OVERVIEW",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "CASES", href: "/dashboard/cases", icon: FolderOpen },
  { label: "NETWORKS", href: "/dashboard/networks", icon: Network },
  { label: "ENTITIES", href: "/dashboard/entities", icon: Users },
  { label: "ALERTS", href: "/dashboard/alerts", icon: ShieldAlert },
  { label: "DATA SOURCES", href: "/dashboard/data-sources", icon: Database },
  { label: "SETTINGS", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-white/[0.1] bg-[#0b0c10]/95 backdrop-blur-md transition-all duration-300 shrink-0",
        collapsed ? "w-[56px]" : "w-[200px]"
      )}
    >
      {/* Corner bracket top-left */}
      <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-white/40 pointer-events-none z-10" />
      <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-white/40 pointer-events-none z-10" />

      {/* Brand */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 h-14 border-b border-white/[0.07] shrink-0",
          collapsed && "justify-center"
        )}
      >
        <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
        {!collapsed && (
          <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-white uppercase whitespace-nowrap">
            INVESTIGATE
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-[11px] font-mono tracking-widest uppercase transition-all duration-150 relative",
                active
                  ? "text-white bg-white/[0.05] border-l-2 border-emerald-400"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.03] border-l-2 border-transparent",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon
                className={cn(
                  "shrink-0 transition-colors",
                  collapsed ? "w-4 h-4" : "w-3.5 h-3.5",
                  active
                    ? "text-emerald-400"
                    : "text-white/40 group-hover:text-white/60"
                )}
              />
              {!collapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle button */}
      <div className="border-t border-white/[0.07] p-2 shrink-0">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-2 text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150 font-mono text-[10px] tracking-widest uppercase",
            collapsed && "justify-center"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>COLLAPSE</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
