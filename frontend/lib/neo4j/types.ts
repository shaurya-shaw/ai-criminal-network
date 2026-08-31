// ============================================================================
// AI Criminal Network — Neo4j Investigation Graph TypeScript Types
// ============================================================================

export type NodeLabel =
  | "Case"
  | "Entity"
  | "Person"
  | "Organization"
  | "Location"
  | "Phone"
  | "Vehicle"
  | "BankAccount"
  | "Evidence"
  | "Event";

export type RelationshipType =
  | "INVOLVES"
  | "KNOWS"
  | "CALLED"
  | "VISITED"
  | "WORKS_FOR"
  | "OWNS"
  | "TRANSFERRED_TO"
  | "ASSOCIATED_WITH"
  | "MENTIONED_IN"
  | "OCCURRED_AT";

// ─── Base Node Interface ──────────────────────────────────────────────────────

export interface BaseGraphNode {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseEntityNode extends BaseGraphNode {
  name: string;
  riskScore: number;
  status: "FLAGGED" | "MONITORING" | "CLEARED";
  lastSeen?: string;
}

// ─── Concrete Node Types ──────────────────────────────────────────────────────

export interface CaseNode extends BaseGraphNode {
  name: string;
  status: "ACTIVE" | "PENDING" | "CLOSED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  classification?: string;
  jurisdiction?: string;
  leadInvestigator?: string;
  description?: string;
  openedAt?: string;
}

export interface PersonNode extends BaseEntityNode {
  alias?: string;
  nationalId?: string;
  dateOfBirth?: string;
  nationality?: string;
}

export interface OrganizationNode extends BaseEntityNode {
  regNumber?: string;
  orgType?: string;
  jurisdiction?: string;
}

export interface LocationNode extends BaseEntityNode {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface PhoneNode extends BaseEntityNode {
  number: string;
  carrier?: string;
  imei?: string;
}

export interface VehicleNode extends BaseEntityNode {
  licensePlate: string;
  makeModel?: string;
  color?: string;
  vin?: string;
}

export interface BankAccountNode extends BaseEntityNode {
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  currency?: string;
}

export interface EvidenceNode extends BaseGraphNode {
  title: string;
  evidenceType: "DOCUMENT" | "FINANCIAL_RECORD" | "COMMUNICATION" | "MEDIA" | "PHYSICAL";
  source?: string;
  storageRef?: string;
  collectedAt?: string;
  description?: string;
}

export interface EventNode extends BaseGraphNode {
  title: string;
  eventType: "SURVEILLANCE" | "FINANCIAL" | "COMMUNICATION" | "ARREST" | "INTEL" | "SYSTEM";
  timestamp: string;
  description?: string;
}

// ─── Relationship Property Interfaces ─────────────────────────────────────────

export interface InvolvesRel {
  role?: string;
  confidence?: number;
  addedAt?: string;
}

export interface KnowsRel {
  relationshipType?: string;
  confidence?: number;
  since?: string;
  lastContact?: string;
}

export interface CalledRel {
  timestamp: string;
  durationSeconds?: number;
  cellTowerId?: string;
  direction?: "INCOMING" | "OUTGOING";
}

export interface VisitedRel {
  timestamp?: string;
  duration?: string;
  frequency?: number;
}

export interface WorksForRel {
  role?: string;
  since?: string;
  until?: string;
  verified?: boolean;
}

export interface OwnsRel {
  since?: string;
  percentage?: number;
  verified?: boolean;
}

export interface TransferredToRel {
  amount: number;
  currency?: string;
  timestamp: string;
  txHash?: string;
  method?: string;
}

export interface AssociatedWithRel {
  reason?: string;
  confidence?: number;
  flaggedAt?: string;
}

export interface MentionedInRel {
  pageOrTimestamp?: string;
  excerpt?: string;
  confidence?: number;
}

export interface OccurredAtRel {
  timestamp?: string;
  verified?: boolean;
}

// ─── Graph Visualizer Data Shapes ─────────────────────────────────────────────

export interface VisualizerNode {
  id: string;
  label: string;
  type: string;
  riskScore: number;
  status?: string;
  properties?: Record<string, unknown>;
}

export interface VisualizerEdge {
  id?: string;
  source: string;
  target: string;
  type: RelationshipType;
  properties?: Record<string, unknown>;
}

export interface VisualizerGraphData {
  nodes: VisualizerNode[];
  edges: VisualizerEdge[];
}

// ─── Case Investigation Graph API ───────────────────────────────────────────

export type InvestigationNodeType = Exclude<NodeLabel, "Entity">;

export interface InvestigationGraphNode {
  /** Stable Neo4j graph identifier, safe to pass directly to React Flow. */
  id: string;
  /** Human-readable node title. */
  label: string;
  type: InvestigationNodeType;
  riskScore?: number;
  confidence?: number;
  properties: Record<string, unknown>;
}

export interface InvestigationGraphEdge {
  /** Stable relationship identifier. */
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  confidence?: number;
  properties: Record<string, unknown>;
}

export interface InvestigationGraphData {
  nodes: InvestigationGraphNode[];
  edges: InvestigationGraphEdge[];
}

export interface GraphSyncDiagnostics {
  entities: number;
  evidence: number;
  events: number;
  relationships: number;
  skipped: number;
  errors: string[];
}
