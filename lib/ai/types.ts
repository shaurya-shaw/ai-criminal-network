// ─── Document Intelligence Extraction Types ─────────────────────────────────
// Schema designed for reliable Neo4j graph ingestion.

export type EntityType =
  | "Person"
  | "Organization"
  | "Location"
  | "Phone"
  | "Vehicle"
  | "BankAccount";

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

export interface ExtractedEntity {
  id: string;       // Stable ID: "ENT-1", "ENT-2", etc.
  name: string;
  type: EntityType;
  role?: string;
  aliases?: string[];
  riskScore?: number;
  attributes?: Record<string, string>;
  confidence: number; // 0-100
}

export interface ExtractedRelationship {
  source: string;          // Entity ID (e.g. "ENT-1") — MUST exist in entities[]
  target: string;          // Entity ID (e.g. "ENT-2") — MUST exist in entities[]
  sourceName?: string;     // Resolved entity name for UI display
  targetName?: string;     // Resolved entity name for UI display
  type: RelationshipType;
  description: string;
  confidence: number;      // 0-100
  metadata?: Record<string, string | number>;
  evidenceReferences?: string[]; // Evidence IDs (e.g. "EVID-1") — MUST exist in evidenceReferences[]
}

export interface ExtractedEvent {
  id: string;              // Stable ID: "EVT-1", "EVT-2", etc.
  title: string;
  type: string;
  timestamp?: string;
  description: string;
  location?: string;
  entitiesInvolved?: string[];  // Entity IDs — MUST exist in entities[]
}

export interface ExtractedEvidenceRef {
  id: string;              // Stable ID: "EVID-1", "EVID-2", etc.
  excerpt: string;         // Verbatim text from document — MUST NOT be empty
  pageOrSection?: string;
  relevance: string;
  entitiesReferenced?: string[]; // Entity IDs — MUST exist in entities[]
}

export interface ExtractedAlert {
  id?: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  category?: string;
  entityId?: string;
}


export interface ExtractedAIAssessment {
  finding: string;
  confidence: number;
  category: string;
}

export interface IntelligenceExtractionResult {
  caseTitle?: string;
  summary: string;
  brief?: string;
  jurisdiction?: string;
  classification?: string;
  confidenceScore: number;
  aiAssessment?: ExtractedAIAssessment;
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  events: ExtractedEvent[];
  evidenceReferences: ExtractedEvidenceRef[];
  alerts?: ExtractedAlert[];
  extractedAt?: string;
  modelUsed?: string;
}

