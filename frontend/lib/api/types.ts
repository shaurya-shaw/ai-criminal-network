// Universal API & Domain Data Types

export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type CaseStatus = "ACTIVE" | "CLOSED" | "PENDING";
export type EntityType = "PERSON" | "ORGANIZATION" | "LOCATION" | "PHONE" | "ACCOUNT";
export type EntityStatus = "FLAGGED" | "MONITORING" | "CLEARED";
export type TimelineEventType = "SURVEILLANCE" | "FINANCIAL" | "COMMUNICATION" | "ARREST" | "INTEL" | "SYSTEM";
export type EvidenceType = "DOCUMENT" | "FINANCIAL_RECORD" | "COMMUNICATION" | "MEDIA" | "PHYSICAL";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertStatus = "NEW" | "ACKNOWLEDGED" | "RESOLVED";
export type NetworkRiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type DataSourceStatus = "SYNCED" | "PARTIAL" | "FAILED";

export interface CaseEntity {
  id: string;
  name: string;
  alias?: string;
  type: EntityType;
  riskScore: number;
  status: EntityStatus;
  lastSeen: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: TimelineEventType;
  relatedEntities?: string[];
}

export interface Evidence {
  id: string;
  title: string;
  type: EvidenceType;
  source: string;
  dateAdded: string;
  linkedEntities: string[];
  description: string;
}

export interface CaseAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
}

export interface AIMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
}

export interface CaseNetwork {
  id: string;
  name: string;
  nodes: number;
  edges: number;
  riskLevel: NetworkRiskLevel;
}

export interface CaseDetail {
  id: string;
  name: string;
  status: CaseStatus;
  priority: Priority;
  description: string;
  brief: string;
  investigator: string;
  team: string[];
  opened: string;
  updated: string;
  jurisdiction: string;
  classification: string;
  entityCount: number;
  relationshipCount: number;
  evidenceCount: number;
  alertCount: number;
  aiAssessment: {
    finding: string;
    confidence: number;
    category: string;
  };
  networks: CaseNetwork[];
  entities: CaseEntity[];
  timeline: TimelineEvent[];
  evidence: Evidence[];
  alerts: CaseAlert[];
  aiMessages: AIMessage[];
}

export interface CaseSummary {
  id: string;
  name: string;
  status: CaseStatus;
  priority: Priority;
  entities: number;
  networks: number;
  investigator: string;
  opened: string;
  updated: string;
  description: string;
}

export interface Entity {
  id: string;
  name: string;
  alias?: string;
  type: EntityType;
  riskScore: number;
  cases: string[];
  lastSeen: string;
  status: EntityStatus;
}

export interface NetworkGraphNode {
  id: string;
  label: string;
  type: EntityType;
  riskScore: number;
}

export interface NetworkGraphEdge {
  source: string;
  target: string;
  relationship: string;
  confidence: number;
}

export interface NetworkEntry {
  id: string;
  name: string;
  nodes: number;
  edges: number;
  risk: NetworkRiskLevel;
  crossBorder: boolean;
  regions: string[];
  caseId: string;
  lastActivity: string;
  graphTopology?: {
    nodes: NetworkGraphNode[];
    edges: NetworkGraphEdge[];
  };
}

export interface GlobalAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  caseId: string;
  timestamp: string;
  iconType?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  status: DataSourceStatus;
  latency: string;
  records: string;
  lastSync: string;
}

export interface SystemPreferences {
  alertNotifications: boolean;
  autoSyncDataSources: boolean;
  crossCaseEntityMatching: boolean;
  sessionTimeout: boolean;
}

export interface OperatorProfile {
  clearanceLevel: string;
  accessRole: string;
  jurisdiction: string;
  sessionToken: string;
}

export interface ActivityLog {
  id: string;
  time: string;
  label: string;
  severityColor: "emerald" | "amber" | "cyan" | "red";
}

export interface OverviewTelemetry {
  stats: {
    activeCases: { value: number; delta: string };
    totalEntities: { value: number; delta: string };
    networks: { value: number; delta: string };
    alerts: { value: number; delta: string };
  };
  activeInvestigations: CaseSummary[];
  priorityAlerts: GlobalAlert[];
  recentActivity: ActivityLog[];
}
