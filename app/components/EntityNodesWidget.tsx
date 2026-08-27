"use client";

import React, { useState } from "react";
import { User, Calendar, MapPin } from "lucide-react";

interface NodeItem {
  id: string;
  label: string;
  count: string;
  desc: string;
  icon: React.ElementType;
}

const NODES: NodeItem[] = [
  {
    id: "person",
    label: "PERSON",
    count: "1,420+",
    desc: "Entities, aliases, associates & phone records",
    icon: User,
  },
  {
    id: "event",
    label: "EVENT",
    count: "8,910+",
    desc: "Transactions, meetings, timestamps & logs",
    icon: Calendar,
  },
  {
    id: "location",
    label: "LOCATION",
    count: "630+",
    desc: "Geo-coordinates, safehouses & transit nodes",
    icon: MapPin,
  },
];

export default function EntityNodesWidget() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md pt-4">
      {/* Node Graphic Line Bar */}
      <div className="relative flex items-center justify-between px-2 mb-3">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 h-[1px] bg-white/20 z-0" />
        
        {/* Animated Tracer Line Effect */}
        <div className="absolute left-6 right-6 h-[1px] animate-tracer z-0 opacity-60" />

        {/* Nodes */}
        {NODES.map((node) => {
          const isSelected = activeNode === node.id;
          return (
            <div
              key={node.id}
              className="relative z-10 flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
            >
              {/* Node Dot / Indicator */}
              <div
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 flex items-center justify-center ${
                  isSelected
                    ? "bg-white border-white ring-4 ring-white/20 scale-125"
                    : "bg-[#090a0d] border-white/60 group-hover:border-white group-hover:scale-110"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isSelected ? "bg-black" : "bg-white/80 group-hover:bg-white"
                  }`}
                />
              </div>

              {/* Pulsing ring on the middle/active node */}
              {!isSelected && node.id === "event" && (
                <div className="absolute top-0 w-3.5 h-3.5 rounded-full animate-node-pulse pointer-events-none" />
              )}

              {/* Quick Hover Tooltip */}
              {isSelected && (
                <div className="absolute bottom-6 mb-2 px-2.5 py-1.5 bg-[#14161f] border border-white/20 rounded shadow-xl whitespace-nowrap z-30 text-[11px] font-mono text-white/90 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <node.icon className="w-3 h-3 text-white/70" />
                    <span>{node.label}</span>
                    <span className="text-[10px] text-white/40 ml-1">({node.count})</span>
                  </div>
                  <div className="text-[10px] text-white/60 font-sans mt-0.5">{node.desc}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Node Labels under each dot */}
      <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-white/60 px-0">
        {NODES.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
            className={`transition-colors duration-200 uppercase font-medium hover:text-white ${
              activeNode === node.id ? "text-white" : "text-white/60"
            }`}
          >
            {node.label}
          </button>
        ))}
      </div>
    </div>
  );
}
