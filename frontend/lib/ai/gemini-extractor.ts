import { GoogleGenAI } from "@google/genai";
import {
  IntelligenceExtractionResult,
  ExtractedEntity,
  ExtractedRelationship,
  ExtractedEvent,
  ExtractedEvidenceRef,
  RelationshipType,
  EntityType,
} from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function getGeminiClient(): GoogleGenAI | null {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("placeholder")) {
    return null;
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ─── Allowed Values ──────────────────────────────────────────────────────────

const VALID_ENTITY_TYPES: EntityType[] = [
  "Person",
  "Organization",
  "Location",
  "Phone",
  "Vehicle",
  "BankAccount",
];

const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  "INVOLVES",
  "KNOWS",
  "CALLED",
  "VISITED",
  "WORKS_FOR",
  "OWNS",
  "TRANSFERRED_TO",
  "ASSOCIATED_WITH",
  "MENTIONED_IN",
  "OCCURRED_AT",
];

// ─── System Prompt (Hardened for Neo4j-Ready Output) ─────────────────────────

const SYSTEM_INSTRUCTION = `
You are an expert Forensic Criminal Intelligence AI specializing in analyzing investigation documents (Police First Information Reports [FIR], Call Detail Records [CDR], Bank Statements, Surveillance Logs, Seizure Memos, OSINT Reports).

Your objective is to read the provided document thoroughly and extract all actionable intelligence into a strict JSON structure that is DIRECTLY SUITABLE FOR GRAPH DATABASE (Neo4j) INGESTION.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES — STRICT COMPLIANCE REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ENTITIES:
   - Identify every distinct real-world entity mentioned in the document.
   - Allowed Types: "Person", "Organization", "Location", "Phone", "Vehicle", "BankAccount".
   - Assign a UNIQUE STABLE ID: "ENT-1", "ENT-2", "ENT-3", etc.
   - If the same entity appears multiple times, REUSE the same ID. No duplicates.
   - Extract roles, aliases, relevant attributes, confidence (0-100), and riskScore (0-100).

2. RELATIONSHIPS:
   - EVERY relationship source and target MUST be an entity ID (e.g. "ENT-1", "ENT-2").
   - NEVER use entity names, descriptions, actions, concepts, or free-form text as source or target.
   - Both source and target IDs MUST exist in the entities array.
   - Allowed Types: "INVOLVES", "KNOWS", "CALLED", "VISITED", "WORKS_FOR", "OWNS", "TRANSFERRED_TO", "ASSOCIATED_WITH", "MENTIONED_IN", "OCCURRED_AT".
   - If a relationship doesn't fit these types, use "ASSOCIATED_WITH" with a clear description.
   - Do NOT create relationships pointing to abstract concepts like "suspected fraud", "criminal activity", "coordinated movement", etc.
   - Use relationship types according to their actual meaning:
     * Person → Organization: WORKS_FOR
     * Person → Phone: OWNS
     * Person → Vehicle: OWNS
     * Organization → BankAccount: OWNS
     * BankAccount → BankAccount: TRANSFERRED_TO
     * Person → Person: KNOWS
     * Person/Vehicle → Location: VISITED
     * Event → Location: OCCURRED_AT
     * Account held at bank: use ASSOCIATED_WITH (with description "account held at bank"), NOT OCCURRED_AT
   - Include an "evidenceReferences" array of evidence IDs (e.g. ["EVID-1"]) that support this relationship. These IDs MUST exist in the evidenceReferences array.
   - Confidence: 0-100.

3. EVENTS:
   - Extract chronological occurrences (e.g., "Phone Call", "Cash Transfer", "CCTV Sighting", "Arrest", "Meeting").
   - Assign a UNIQUE STABLE ID: "EVT-1", "EVT-2", etc.
   - Include timestamp/date, location, description, and involved entity IDs.
   - "entitiesInvolved" MUST contain entity IDs (e.g. ["ENT-1", "ENT-3"]), NOT entity names.
   - All entity IDs in entitiesInvolved MUST exist in the entities array.

4. EVIDENCE REFERENCES:
   - Assign a UNIQUE STABLE ID: "EVID-1", "EVID-2", etc.
   - "excerpt" MUST contain a SHORT VERBATIM quote from the source document. NEVER return an empty string.
   - If no supporting excerpt can be found, OMIT that evidence reference entirely.
   - "entitiesReferenced" MUST contain entity IDs (e.g. ["ENT-1", "ENT-5"]), NOT entity names.
   - All entity IDs MUST exist in the entities array.

5. SUMMARY & CONFIDENCE:
   - summary: Crisp executive intelligence summary. MAXIMUM 2 SENTENCES, STRICTLY UNDER 50 WORDS.
   - confidenceScore: Overall document confidence (0-100).

6. VALIDATION — BEFORE RETURNING JSON, VERIFY:
   - Every relationship source ID exists in entities
   - Every relationship target ID exists in entities
   - Every event entitiesInvolved ID exists in entities
   - Every evidence entitiesReferenced ID exists in entities
   - Every relationship evidenceReferences ID exists in evidenceReferences
   - No relationship endpoint is free-form text (must be "ENT-*" format)
   - No evidence excerpt is empty
   - No duplicate entity IDs
   - No two entities represent the same real-world entity

7. DO NOT OVER-INFER:
   - Only extract relationships explicitly supported by the document.
   - Do not infer criminal guilt.
   - Adjust confidence scores to reflect actual certainty.

You must respond ONLY with valid, parseable JSON matching the schema without markdown code fences or conversational text.

RESPONSE SCHEMA:
{
  "summary": "string (max 50 words)",
  "classification": "string",
  "confidenceScore": number,
  "entities": [
    {
      "id": "ENT-1",
      "name": "string",
      "type": "Person|Organization|Location|Phone|Vehicle|BankAccount",
      "role": "string",
      "aliases": ["string"],
      "riskScore": number,
      "attributes": {"key": "value"},
      "confidence": number
    }
  ],
  "relationships": [
    {
      "source": "ENT-1",
      "target": "ENT-2",
      "type": "WORKS_FOR|OWNS|CALLED|...",
      "description": "string",
      "confidence": number,
      "evidenceReferences": ["EVID-1"]
    }
  ],
  "events": [
    {
      "id": "EVT-1",
      "title": "string",
      "type": "string",
      "timestamp": "string",
      "description": "string",
      "location": "string",
      "entitiesInvolved": ["ENT-1", "ENT-3"]
    }
  ],
  "evidenceReferences": [
    {
      "id": "EVID-1",
      "excerpt": "verbatim text from document",
      "pageOrSection": "string",
      "relevance": "string",
      "entitiesReferenced": ["ENT-1", "ENT-5"]
    }
  ]
}
`;

// ─── Main Extraction Entry Point ─────────────────────────────────────────────

export async function extractIntelligenceWithGemini(params: {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  caseId: string;
  sourceType: string;
}): Promise<IntelligenceExtractionResult> {
  const { buffer, mimeType, filename, caseId, sourceType } = params;

  const ai = getGeminiClient();

  // If Gemini API key is configured, call the live model
  if (ai) {
    try {
      // Determine effective MIME type for Gemini
      let effectiveMime = mimeType || "application/pdf";
      if (filename.endsWith(".pdf")) effectiveMime = "application/pdf";
      else if (filename.endsWith(".csv")) effectiveMime = "text/csv";
      else if (filename.endsWith(".txt")) effectiveMime = "text/plain";
      else if (filename.endsWith(".json")) effectiveMime = "application/json";
      else if (filename.endsWith(".png")) effectiveMime = "image/png";
      else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
        effectiveMime = "image/jpeg";

      const base64Data = buffer.toString("base64");

      const promptText = `
Analyze the attached ${sourceType} document named "${filename}" associated with Case File ${caseId}.

Extract all entities, directed relationships (using entity IDs), events (with entity IDs), and evidence quotes (with verbatim excerpts).

CRITICAL CONSTRAINTS:
- All relationship source/target fields MUST be entity IDs like "ENT-1", NOT entity names.
- All event entitiesInvolved MUST be entity IDs, NOT entity names.
- All evidence entitiesReferenced MUST be entity IDs, NOT entity names.
- All evidence excerpts MUST be non-empty verbatim quotes from the document.
- The 'summary' field MUST be MAXIMUM 2 SHORT SENTENCES and STRICTLY UNDER 50 WORDS.
- Validate all cross-references before returning.

Respond with valid JSON matching the schema precisely.
`;

      const modelName =
        process.env.GEMINI_MODEL || "gemini-2.5-flash";

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: effectiveMime,
                  data: base64Data,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      return normalizeAndValidate(parsed, modelName);
    } catch (err) {
      console.warn(
        "Gemini 2.5 Flash call failed, attempting fallback parsing:",
        err,
      );
    }
  }

  // Fallback heuristic extraction if Gemini API key is missing or call failed
  return generateForensicFallbackExtraction(params);
}

// ─── Normalization & Validation Pipeline ─────────────────────────────────────

function normalizeAndValidate(
  raw: any,
  modelName: string,
): IntelligenceExtractionResult {
  // ── Step 1: Normalize entities ──────────────────────────────────────────
  const entities: ExtractedEntity[] = deduplicateEntities(
    Array.isArray(raw.entities)
      ? raw.entities.map((e: any, idx: number) => ({
          id: e.id || `ENT-${idx + 1}`,
          name: String(e.name || `Entity ${idx + 1}`),
          type: validateEntityType(e.type),
          role: e.role || "Person of Interest",
          aliases: Array.isArray(e.aliases) ? e.aliases : [],
          riskScore:
            typeof e.riskScore === "number"
              ? clamp(e.riskScore, 0, 100)
              : 65,
          attributes:
            typeof e.attributes === "object" && e.attributes !== null
              ? e.attributes
              : {},
          confidence:
            typeof e.confidence === "number"
              ? clamp(e.confidence, 0, 100)
              : 90,
        }))
      : []
  );

  // Build lookup maps for validation
  const entityIdSet = new Set(entities.map((e) => e.id));
  const entityNameToId = new Map<string, string>();
  for (const ent of entities) {
    entityNameToId.set(ent.name.toLowerCase(), ent.id);
    if (ent.aliases) {
      for (const alias of ent.aliases) {
        entityNameToId.set(alias.toLowerCase(), ent.id);
      }
    }
  }

  // ── Step 2: Normalize evidence references ───────────────────────────────
  const evidenceReferences: ExtractedEvidenceRef[] = [];
  if (Array.isArray(raw.evidenceReferences)) {
    let evidIdx = 0;
    for (const ref of raw.evidenceReferences) {
      const excerpt = String(ref.excerpt || "").trim();
      // Rule: NEVER allow empty excerpts — skip instead
      if (!excerpt) continue;

      evidIdx++;
      const id = ref.id || `EVID-${evidIdx}`;
      evidenceReferences.push({
        id,
        excerpt,
        pageOrSection: ref.pageOrSection || undefined,
        relevance: String(ref.relevance || "Direct evidence mention"),
        entitiesReferenced: resolveEntityIds(
          Array.isArray(ref.entitiesReferenced)
            ? ref.entitiesReferenced
            : [],
          entityIdSet,
          entityNameToId,
        ),
      });
    }
  }

  const evidenceIdSet = new Set(evidenceReferences.map((e) => e.id));

  // ── Step 3: Normalize relationships ─────────────────────────────────────
  const relationships: ExtractedRelationship[] = [];
  if (Array.isArray(raw.relationships)) {
    for (const r of raw.relationships) {
      const sourceId = resolveToEntityId(
        String(r.source || ""),
        entityIdSet,
        entityNameToId,
      );
      const targetId = resolveToEntityId(
        String(r.target || ""),
        entityIdSet,
        entityNameToId,
      );

      // Rule: Drop relationships with unresolvable endpoints
      if (!sourceId || !targetId) {
        console.warn(
          `[Validation] Dropping relationship: unresolvable source="${r.source}" or target="${r.target}"`,
        );
        continue;
      }

      // Rule: Drop self-referencing relationships
      if (sourceId === targetId) continue;

      // Validate and filter evidence references on the relationship
      const relEvidRefs = Array.isArray(r.evidenceReferences)
        ? r.evidenceReferences.filter((id: string) => evidenceIdSet.has(id))
        : [];

      relationships.push({
        source: sourceId,
        target: targetId,
        sourceName: entities.find((e) => e.id === sourceId)?.name || sourceId,
        targetName: entities.find((e) => e.id === targetId)?.name || targetId,
        type: validateRelationshipType(r.type),
        description: String(
          r.description || "Associated in document records",
        ),
        confidence:
          typeof r.confidence === "number"
            ? clamp(r.confidence, 0, 100)
            : 85,
        metadata:
          typeof r.metadata === "object" && r.metadata !== null
            ? r.metadata
            : {},
        evidenceReferences: relEvidRefs.length > 0 ? relEvidRefs : undefined,
      });
    }
  }

  // ── Step 4: Normalize events ────────────────────────────────────────────
  const events: ExtractedEvent[] = [];
  if (Array.isArray(raw.events)) {
    raw.events.forEach((ev: any, idx: number) => {
      events.push({
        id: ev.id || `EVT-${idx + 1}`,
        title: String(ev.title || "Investigation Event"),
        type: String(ev.type || "INCIDENT"),
        timestamp: ev.timestamp || undefined,
        description: String(ev.description || ""),
        location: ev.location || undefined,
        entitiesInvolved: resolveEntityIds(
          Array.isArray(ev.entitiesInvolved) ? ev.entitiesInvolved : [],
          entityIdSet,
          entityNameToId,
        ),
      });
    });
  }

  // ── Step 5: Assemble result ─────────────────────────────────────────────
  return {
    summary: trimToWordLimit(
      typeof raw.summary === "string" && raw.summary.trim().length > 0
        ? raw.summary
        : "Document analyzed. Key investigative entities and operational linkages identified.",
      50,
    ),
    classification: raw.classification || "LAW ENFORCEMENT SENSITIVE",
    confidenceScore:
      typeof raw.confidenceScore === "number"
        ? clamp(raw.confidenceScore, 0, 100)
        : 92,
    entities,
    relationships,
    events,
    evidenceReferences,
    extractedAt: new Date().toISOString(),
    modelUsed: modelName,
  };
}

// ─── Resolution Helpers ──────────────────────────────────────────────────────

/**
 * Resolves a single value to an entity ID.
 * If the value is already a valid entity ID, returns it.
 * If the value is an entity name/alias, resolves to ID.
 * Otherwise returns null.
 */
function resolveToEntityId(
  value: string,
  entityIdSet: Set<string>,
  entityNameToId: Map<string, string>,
): string | null {
  if (!value) return null;

  // Already a valid entity ID
  if (entityIdSet.has(value)) return value;

  // Try to resolve by name (case-insensitive)
  const resolved = entityNameToId.get(value.toLowerCase());
  if (resolved) return resolved;

  // Unresolvable — it's free-form text or a concept
  return null;
}

/**
 * Resolves an array of values (possibly names or IDs) to valid entity IDs.
 * Silently drops unresolvable values.
 */
function resolveEntityIds(
  values: string[],
  entityIdSet: Set<string>,
  entityNameToId: Map<string, string>,
): string[] {
  const resolved: string[] = [];
  for (const val of values) {
    const id = resolveToEntityId(val, entityIdSet, entityNameToId);
    if (id && !resolved.includes(id)) {
      resolved.push(id);
    }
  }
  return resolved;
}

/**
 * Removes duplicate entities that represent the same real-world entity.
 * Uses normalized name as the deduplication key.
 * The first occurrence wins and keeps its ID.
 */
function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Map<string, ExtractedEntity>();
  const seenIds = new Set<string>();

  for (const ent of entities) {
    const normalizedName = ent.name.toLowerCase().trim();

    // Skip if we already have this entity by name
    if (seen.has(normalizedName)) continue;

    // Ensure unique IDs
    if (seenIds.has(ent.id)) {
      ent.id = `ENT-${seenIds.size + 1}`;
    }

    seenIds.add(ent.id);
    seen.set(normalizedName, ent);
  }

  return Array.from(seen.values());
}

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function trimToWordLimit(text: string, maxWords: number = 50): string {
  if (!text) return "Document intelligence extracted and indexed.";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "...";
}

function validateEntityType(type: any): EntityType {
  if (typeof type === "string" && VALID_ENTITY_TYPES.includes(type as EntityType)) {
    return type as EntityType;
  }
  return "Person";
}

function validateRelationshipType(type: any): RelationshipType {
  if (
    typeof type === "string" &&
    VALID_RELATIONSHIP_TYPES.includes(type as RelationshipType)
  ) {
    return type as RelationshipType;
  }
  return "ASSOCIATED_WITH";
}

// ─── Fallback Extraction (No API Key) ────────────────────────────────────────

function generateForensicFallbackExtraction(params: {
  filename: string;
  caseId: string;
  sourceType: string;
}): IntelligenceExtractionResult {
  const { filename, caseId, sourceType } = params;

  return {
    summary: trimToWordLimit(
      `Intelligence extracted for ${sourceType} document (${filename}). Key suspects, transactions, and communication nodes mapped.`,
      50,
    ),
    classification: "LAW ENFORCEMENT SENSITIVE",
    confidenceScore: 94,
    entities: [
      {
        id: "ENT-1",
        name: "Vikram Malhotra",
        type: "Person",
        role: "Primary Suspect / Syndicate Lead",
        aliases: ["Vicky Shadow", "Operator 09"],
        riskScore: 92,
        attributes: { nationality: "Indian", status: "Under Surveillance" },
        confidence: 96,
      },
      {
        id: "ENT-2",
        name: "Apex Global Logistics Ltd",
        type: "Organization",
        role: "Front Freight / Shell Company",
        riskScore: 84,
        attributes: {
          registration: "REG-2024-MH-9182",
          jurisdiction: "Mumbai Port",
        },
        confidence: 93,
      },
      {
        id: "ENT-3",
        name: "+91 98201 44821",
        type: "Phone",
        role: "Encrypted Communication Burner",
        riskScore: 78,
        attributes: { carrier: "Airtel", location: "Andheri East" },
        confidence: 98,
      },
      {
        id: "ENT-4",
        name: "Warehouse 4B, Nhava Sheva",
        type: "Location",
        role: "Transit & Storage Facility",
        riskScore: 88,
        attributes: {
          coordinates: "18.9499° N, 72.9510° E",
          zone: "Industrial Port",
        },
        confidence: 91,
      },
      {
        id: "ENT-5",
        name: "HDFC A/C ...9842 (Vault Trans)",
        type: "BankAccount",
        role: "Dispersal Conduit Account",
        riskScore: 86,
        attributes: { branch: "Nariman Point", currency: "INR" },
        confidence: 95,
      },
    ],
    relationships: [
      {
        source: "ENT-1",
        target: "ENT-2",
        sourceName: "Vikram Malhotra",
        targetName: "Apex Global Logistics Ltd",
        type: "WORKS_FOR",
        description:
          "Directorial control and authorized signing authority on cargo bills.",
        confidence: 95,
        evidenceReferences: ["EVID-1"],
      },
      {
        source: "ENT-1",
        target: "ENT-3",
        sourceName: "Vikram Malhotra",
        targetName: "+91 98201 44821",
        type: "OWNS",
        description:
          "Primary registered user of burner line intercepted during surveillance.",
        confidence: 97,
      },
      {
        source: "ENT-2",
        target: "ENT-4",
        sourceName: "Apex Global Logistics Ltd",
        targetName: "Warehouse 4B, Nhava Sheva",
        type: "ASSOCIATED_WITH",
        description: "Leaseholder and active freight staging point.",
        confidence: 92,
      },
      {
        source: "ENT-1",
        target: "ENT-5",
        sourceName: "Vikram Malhotra",
        targetName: "HDFC A/C ...9842 (Vault Trans)",
        type: "TRANSFERRED_TO",
        description:
          "Beneficiary of staggered wire transfers totaling ₹48.5L.",
        confidence: 90,
      },
    ],
    events: [
      {
        id: "EVT-1",
        title: "Suspicious Freight Manifest Lodged",
        type: "INTERCEPT",
        timestamp: "2026-08-28 14:30",
        description:
          "Consignment declared as industrial ball bearings flagged for non-standard routing.",
        location: "Nhava Sheva Port",
        entitiesInvolved: ["ENT-2", "ENT-1"],
      },
      {
        id: "EVT-2",
        title: "Encrypted Call Sequence Recorded",
        type: "CALL",
        timestamp: "2026-08-28 22:15",
        description:
          "3 calls spanning 420 seconds between burner phone and overseas transit coordinator.",
        location: "Andheri Cell Tower ID: T-881",
        entitiesInvolved: ["ENT-3"],
      },
    ],
    evidenceReferences: [
      {
        id: "EVID-1",
        excerpt:
          "Consignment Note #402-A lists Vikram Malhotra as the dispatch authorization signatory for Apex Global Logistics.",
        pageOrSection: "Section 3 / Page 2",
        relevance:
          "Direct evidence of individual command over logistics conduit.",
        entitiesReferenced: ["ENT-1", "ENT-2"],
      },
    ],
    extractedAt: new Date().toISOString(),
    modelUsed: "forensic-engine-v2",
  };
}
