import React from "react";
import {
  User,
  Building2,
  MapPin,
  Phone,
  CreditCard,
  Car,
  ShieldAlert,
  Eye,
  CheckCircle2,
} from "lucide-react";
import type {
  EntityType,
  EntityStatus,
  TimelineEventType,
  EvidenceType,
  AlertSeverity,
  AlertStatus,
} from "../../data";

export const priorityColors: Record<string, string> = {
  HIGH: "text-red-400 border-red-500/30 bg-red-950/40",
  MEDIUM: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  LOW: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
};

export const statusColors: Record<string, string> = {
  ACTIVE: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30",
  PENDING: "text-amber-400 border-amber-500/30 bg-amber-950/30",
  CLOSED: "text-white/40 border-white/10 bg-white/5",
};

export const entityTypeIcons: Record<EntityType, React.ElementType> = {
  PERSON: User,
  ORGANIZATION: Building2,
  LOCATION: MapPin,
  PHONE: Phone,
  ACCOUNT: CreditCard,
  VEHICLE: Car,
};

export const entityTypeColors: Record<EntityType, string> = {
  PERSON: "text-emerald-400",
  ORGANIZATION: "text-cyan-400",
  LOCATION: "text-amber-400",
  PHONE: "text-purple-400",
  ACCOUNT: "text-blue-400",
  VEHICLE: "text-teal-400",
};


export const entityStatusColors: Record<EntityStatus, string> = {
  FLAGGED: "text-red-400 border-red-500/30 bg-red-950/40",
  MONITORING: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  CLEARED: "text-white/40 border-white/10 bg-white/5",
};

export const riskScoreColor = (score: number) => {
  if (score >= 80) return "text-red-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-cyan-400";
  return "text-white/40";
};

export const timelineTypeConfig: Record<
  TimelineEventType,
  { color: string; dotColor: string; label: string }
> = {
  SURVEILLANCE: {
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
    dotColor: "bg-cyan-400",
    label: "SURVEILLANCE",
  },
  FINANCIAL: {
    color: "text-amber-400 border-amber-500/30 bg-amber-950/40",
    dotColor: "bg-amber-400",
    label: "FINANCIAL",
  },
  COMMUNICATION: {
    color: "text-purple-400 border-purple-500/30 bg-purple-950/40",
    dotColor: "bg-purple-400",
    label: "COMMS",
  },
  ARREST: {
    color: "text-red-400 border-red-500/30 bg-red-950/40",
    dotColor: "bg-red-400",
    label: "ARREST",
  },
  INTEL: {
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
    dotColor: "bg-emerald-400",
    label: "INTEL",
  },
  SYSTEM: {
    color: "text-white/40 border-white/10 bg-white/5",
    dotColor: "bg-white/40",
    label: "SYSTEM",
  },
};

export const evidenceTypeConfig: Record<
  EvidenceType,
  { color: string; borderColor: string; label: string }
> = {
  DOCUMENT: {
    color: "text-blue-400 border-blue-500/30 bg-blue-950/40",
    borderColor: "border-l-blue-400",
    label: "DOCUMENT",
  },
  FINANCIAL_RECORD: {
    color: "text-amber-400 border-amber-500/30 bg-amber-950/40",
    borderColor: "border-l-amber-400",
    label: "FINANCIAL",
  },
  COMMUNICATION: {
    color: "text-purple-400 border-purple-500/30 bg-purple-950/40",
    borderColor: "border-l-purple-400",
    label: "COMMS",
  },
  MEDIA: {
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
    borderColor: "border-l-cyan-400",
    label: "MEDIA",
  },
  PHYSICAL: {
    color: "text-red-400 border-red-500/30 bg-red-950/40",
    borderColor: "border-l-red-400",
    label: "PHYSICAL",
  },
};

export const alertSeverityColors: Record<AlertSeverity, string> = {
  CRITICAL: "border-l-red-400",
  WARNING: "border-l-amber-400",
  INFO: "border-l-cyan-400",
};

export const alertSeverityBadge: Record<AlertSeverity, string> = {
  CRITICAL: "text-red-400 border-red-500/30 bg-red-950/40",
  WARNING: "text-amber-400 border-amber-500/30 bg-amber-950/40",
  INFO: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
};

export const alertStatusConfig: Record<
  AlertStatus,
  { icon: React.ElementType; color: string }
> = {
  NEW: { icon: ShieldAlert, color: "text-red-400" },
  ACKNOWLEDGED: { icon: Eye, color: "text-amber-400" },
  RESOLVED: { icon: CheckCircle2, color: "text-white/30" },
};

export const caseNavSections = [
  { id: "summary", label: "Summary" },
  { id: "graph", label: "Network Graph" },
  { id: "entities", label: "Entities" },
  { id: "timeline", label: "Timeline" },
  { id: "evidence", label: "Evidence" },
  { id: "alerts", label: "Alerts" },
  { id: "ai", label: "AI Investigator" },
];

export const aiQuickActions = [
  "Analyze connections",
  "Risk assessment",
  "Suggest leads",
  "Summarize case",
];
