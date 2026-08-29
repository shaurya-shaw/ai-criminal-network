"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import GridBackground from "../components/GridBackground";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Disable background sparkles on case detail pages (e.g. /dashboard/cases/CASE-0091)
  const isCaseDetailPage = Boolean(
    pathname &&
      pathname.startsWith("/dashboard/cases/") &&
      pathname !== "/dashboard/cases",
  );

  return (
    <div className="relative min-h-screen w-full bg-[#090a0d] text-white font-mono overflow-hidden flex flex-col">
      {/* Fixed grid background behind everything */}
      <GridBackground showSparkles={!isCaseDetailPage} />

      {/* App shell */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Top bar */}
        <TopBar />

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
