// ─── Document Intelligence Extraction Types ─────────────────────────────────

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
  id: string;
  name: string;
  type: EntityType;
  role?: string;
  aliases?: string[];
  riskScore?: number;
  attributes?: Record<string, string>;
  confidence: number;
}

export interface ExtractedRelationship {
  source: string;
  target: string;
  type: RelationshipType;
  description: string;
  confidence: number;
  metadata?: Record<string, string | number>;
}

export interface ExtractedEvent {
  title: string;
  type: string;
  timestamp?: string;
  description: string;
  location?: string;
  entitiesInvolved?: string[];
}

export interface ExtractedEvidenceRef {
  excerpt: string;
  pageOrSection?: string;
  relevance: string;
  entitiesReferenced?: string[];
}

export interface IntelligenceExtractionResult {
  summary: string;
  classification?: string;
  confidenceScore: number;
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  events: ExtractedEvent[];
  evidenceReferences: ExtractedEvidenceRef[];
  extractedAt?: string;
  modelUsed?: string;
}
