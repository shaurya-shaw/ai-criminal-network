import { fetchCaseGraphInputFromDb, fetchDataSourceById } from "@/lib/supabase/server";
import type { CaseRecord, DataSourceRecord } from "@/lib/supabase/server";
import type {
  ExtractedEntity,
  ExtractedEvidenceRef,
  ExtractedEvent,
  ExtractedRelationship,
  IntelligenceExtractionResult,
} from "@/lib/ai/types";
import { initializeNeo4jSchema, readQuery, withSession } from "./driver";
import type {
  GraphSyncDiagnostics,
  InvestigationGraphData,
  InvestigationGraphEdge,
  InvestigationGraphNode,
  InvestigationNodeType,
} from "./types";

const ENTITY_LABELS: Record<string, string> = {
  Person: "Person",
  PERSON: "Person",
  person: "Person",
  Organization: "Organization",
  ORGANIZATION: "Organization",
  organization: "Organization",
  Location: "Location",
  LOCATION: "Location",
  location: "Location",
  Phone: "Phone",
  PHONE: "Phone",
  phone: "Phone",
  Vehicle: "Vehicle",
  VEHICLE: "Vehicle",
  vehicle: "Vehicle",
  BankAccount: "BankAccount",
  BANKACCOUNT: "BankAccount",
  bankaccount: "BankAccount",
  Account: "BankAccount",
  ACCOUNT: "BankAccount",
};

const RELATIONSHIP_TYPES = new Set([
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
]);

const CASE_MEMBERSHIP_TYPES = new Set(["HAS_ENTITY", "HAS_EVIDENCE", "HAS_EVENT"]);

let schemaPromise: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = initializeNeo4jSchema().then((result) => {
      if (!result.success) {
        throw new Error(
          `Neo4j schema initialization failed: ${result.results
            .filter((item) => item.status === "FAILED")
            .map((item) => item.error || item.statement)
            .join("; ")}`,
        );
      }
    });
    schemaPromise.catch(() => {
      schemaPromise = null;
    });
  }
  return schemaPromise;
}

function sourceKey(caseId: string, sourceId: string) {
  return `${caseId}::${sourceId}`;
}

function entityGraphId(caseId: string, sourceId: string, entityId: string) {
  return `${sourceKey(caseId, sourceId)}::entity::${entityId}`;
}

function eventGraphId(caseId: string, sourceId: string, eventId: string) {
  return `${sourceKey(caseId, sourceId)}::event::${eventId}`;
}

function evidenceGraphId(caseId: string, sourceId: string, evidenceId: string) {
  return `${sourceKey(caseId, sourceId)}::evidence::${evidenceId}`;
}

function diagnostics(): GraphSyncDiagnostics {
  return { entities: 0, evidence: 0, events: 0, relationships: 0, skipped: 0, errors: [] };
}

function recordSkip(result: GraphSyncDiagnostics, message: string) {
  result.skipped += 1;
  if (result.errors.length < 50) result.errors.push(message);
}

function cleanId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function json(value: unknown): string {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

async function mergeCase(caseRow: CaseRecord) {
  await withSession(async (session) =>
    session.executeWrite((tx) =>
      tx.run(
        `
          MERGE (c:Case {id: $id})
          SET c.name = $name,
              c.caseNumber = $caseNumber,
              c.status = $status,
              c.priority = $priority,
              c.classification = $classification,
              c.jurisdiction = $jurisdiction,
              c.leadInvestigator = $leadInvestigator,
              c.description = $description,
              c.openedAt = $openedAt,
              c.updatedAt = datetime()
          RETURN c.id
        `,
        {
          id: caseRow.id,
          name: caseRow.title,
          caseNumber: caseRow.case_number,
          status: caseRow.status,
          priority: caseRow.priority,
          classification: caseRow.classification || null,
          jurisdiction: caseRow.jurisdiction || null,
          leadInvestigator: caseRow.investigator || null,
          description: caseRow.summary || null,
          openedAt: caseRow.created_at || null,
        },
      ),
    ),
    "WRITE",
  );
}

interface EntityRow {
  id: string;
  caseEdgeId: string;
  properties: Record<string, unknown>;
}

interface ItemRow {
  id: string;
  caseEdgeId: string;
  properties: Record<string, unknown>;
}

async function mergeEntityRows(
  caseId: string,
  label: string,
  rows: EntityRow[],
) {
  if (!rows.length) return;
  await withSession(async (session) =>
    session.executeWrite(async (tx) => {
      await tx.run(
        `UNWIND $rows AS row
         MERGE (node:Entity:${label} {id: row.id})
         SET node += row.properties,
             node.updatedAt = datetime()
         RETURN count(node)`,
        { rows },
      );
      await tx.run(
        `UNWIND $rows AS row
         MATCH (c:Case {id: $caseId})
         MATCH (node:Entity {id: row.id})
         MERGE (c)-[rel:HAS_ENTITY {id: row.caseEdgeId}]->(node)
         SET rel.caseId = $caseId, rel.updatedAt = datetime()
         RETURN count(rel)`,
        { caseId, rows },
      );
    }),
    "WRITE",
  );
}

async function mergeItemRows(
  caseId: string,
  label: "Evidence" | "Event",
  membershipType: "HAS_EVIDENCE" | "HAS_EVENT",
  rows: ItemRow[],
) {
  if (!rows.length) return;
  await withSession(async (session) =>
    session.executeWrite(async (tx) => {
      await tx.run(
        `UNWIND $rows AS row
         MERGE (node:${label} {id: row.id})
         SET node += row.properties,
             node.updatedAt = datetime()
         RETURN count(node)`,
        { rows },
      );
      await tx.run(
        `UNWIND $rows AS row
         MATCH (c:Case {id: $caseId})
         MATCH (node:${label} {id: row.id})
         MERGE (c)-[rel:${membershipType} {id: row.caseEdgeId}]->(node)
         SET rel.caseId = $caseId, rel.updatedAt = datetime()
         RETURN count(rel)`,
        { caseId, rows },
      );
    }),
    "WRITE",
  );
}

interface RelationshipRow {
  id: string;
  source: string;
  target: string;
  properties: Record<string, unknown>;
}

async function mergeRelationshipRows(
  type: string,
  rows: RelationshipRow[],
) {
  if (!rows.length) return;
  await withSession(async (session) =>
    session.executeWrite((tx) =>
      tx.run(
        `UNWIND $rows AS row
         MATCH (source {id: row.source})
         MATCH (target {id: row.target})
         MERGE (source)-[rel:${type} {id: row.id}]->(target)
         SET rel += row.properties,
             rel.updatedAt = datetime()
         RETURN count(rel)`,
        { rows },
      ),
    ),
    "WRITE",
  );
}

function normaliseEntityRows(
  caseId: string,
  source: DataSourceRecord,
  entities: ExtractedEntity[],
  result: GraphSyncDiagnostics,
) {
  const byLabel = new Map<string, EntityRow[]>();
  const validEntities = new Map<string, { graphId: string; type: string }>();
  const encountered = new Set<string>();
  const provenance = sourceKey(caseId, source.id);

  for (const entity of entities) {
    const id = cleanId(entity?.id);
    const name = cleanText(entity?.name);
    const rawType = entity?.type || "Person";
    const label =
      ENTITY_LABELS[rawType] ||
      ENTITY_LABELS[rawType.trim()] ||
      ENTITY_LABELS[rawType.toUpperCase()] ||
      "Person";
    if (!id || !name || !label) {
      recordSkip(result, `Skipped invalid entity in source ${source.id}.`);
      continue;
    }
    if (encountered.has(id)) {
      recordSkip(result, `Skipped duplicate entity ID '${id}' in source ${source.id}.`);
      continue;
    }
    encountered.add(id);

    const graphId = entityGraphId(caseId, source.id, id);
    const row: EntityRow = {
      id: graphId,
      caseEdgeId: `${caseId}::contains::${graphId}`,
      properties: {
        id: graphId,
        extractedId: id,
        caseId,
        sourceId: source.id,
        sourceKey: provenance,
        name,
        type: entity.type,
        role: cleanText(entity.role),
        aliases: Array.isArray(entity.aliases) ? entity.aliases.filter(Boolean) : [],
        riskScore: numberOrNull(entity.riskScore),
        confidence: numberOrNull(entity.confidence),
        attributes: json(entity.attributes),
        importedAt: new Date().toISOString(),
      },
    };
    const rows = byLabel.get(label) || [];
    rows.push(row);
    byLabel.set(label, rows);
    validEntities.set(id, { graphId, type: entity.type });
    result.entities += 1;
  }

  return { byLabel, validEntities };
}

async function syncSourceGraph(
  caseRow: CaseRecord,
  source: DataSourceRecord,
): Promise<GraphSyncDiagnostics> {
  const result = diagnostics();
  const extraction = source.extracted_data as IntelligenceExtractionResult | null | undefined;
  await mergeCase(caseRow);
  if (!extraction) return result;

  const caseId = caseRow.id;
  const provenance = sourceKey(caseId, source.id);
  const { byLabel, validEntities } = normaliseEntityRows(
    caseId,
    source,
    Array.isArray(extraction.entities) ? extraction.entities : [],
    result,
  );

  for (const [label, rows] of byLabel) {
    await mergeEntityRows(caseId, label, rows);
  }

  const eventRows: ItemRow[] = [];
  const validEvents = new Map<string, string>();
  const seenEvents = new Set<string>();
  for (const event of (Array.isArray(extraction.events) ? extraction.events : []) as ExtractedEvent[]) {
    const id = cleanId(event?.id);
    const title = cleanText(event?.title);
    if (!id || !title || seenEvents.has(id)) {
      recordSkip(result, `Skipped invalid or duplicate event in source ${source.id}.`);
      continue;
    }
    seenEvents.add(id);
    const graphId = eventGraphId(caseId, source.id, id);
    eventRows.push({
      id: graphId,
      caseEdgeId: `${caseId}::contains::${graphId}`,
      properties: {
        id: graphId,
        extractedId: id,
        caseId,
        sourceId: source.id,
        sourceKey: provenance,
        title,
        type: cleanText(event.type) || "INCIDENT",
        timestamp: cleanText(event.timestamp),
        description: cleanText(event.description),
        location: cleanText(event.location),
        importedAt: new Date().toISOString(),
      },
    });
    validEvents.set(id, graphId);
    result.events += 1;
  }
  await mergeItemRows(caseId, "Event", "HAS_EVENT", eventRows);

  const evidenceRows: ItemRow[] = [];
  const validEvidence = new Map<string, string>();
  const seenEvidence = new Set<string>();
  for (const evidence of (Array.isArray(extraction.evidenceReferences)
    ? extraction.evidenceReferences
    : []) as ExtractedEvidenceRef[]) {
    const id = cleanId(evidence?.id);
    const excerpt = cleanText(evidence?.excerpt);
    if (!id || !excerpt || seenEvidence.has(id)) {
      recordSkip(result, `Skipped invalid or duplicate evidence in source ${source.id}.`);
      continue;
    }
    seenEvidence.add(id);
    const graphId = evidenceGraphId(caseId, source.id, id);
    evidenceRows.push({
      id: graphId,
      caseEdgeId: `${caseId}::contains::${graphId}`,
      properties: {
        id: graphId,
        extractedId: id,
        caseId,
        sourceId: source.id,
        sourceKey: provenance,
        title: evidence.pageOrSection || `Evidence ${id}`,
        excerpt,
        relevance: cleanText(evidence.relevance),
        pageOrSection: cleanText(evidence.pageOrSection),
        importedAt: new Date().toISOString(),
      },
    });
    validEvidence.set(id, graphId);
    result.evidence += 1;
  }
  await mergeItemRows(caseId, "Evidence", "HAS_EVIDENCE", evidenceRows);

  const relationshipGroups = new Map<string, RelationshipRow[]>();
  const seenRelationships = new Set<string>();
  for (const relationship of (Array.isArray(extraction.relationships)
    ? extraction.relationships
    : []) as ExtractedRelationship[]) {
    const sourceId = cleanId(relationship?.source);
    const targetId = cleanId(relationship?.target);
    const type = cleanText(relationship?.type)?.toUpperCase();
    if (!sourceId || !targetId || !type || sourceId === targetId || !RELATIONSHIP_TYPES.has(type)) {
      recordSkip(result, `Skipped invalid relationship in source ${source.id}.`);
      continue;
    }
    const sourceEntity = validEntities.get(sourceId);
    const targetEntity = validEntities.get(targetId);
    if (!sourceEntity || !targetEntity) {
      recordSkip(result, `Skipped ${type} relationship with missing entity endpoint in source ${source.id}.`);
      continue;
    }
    const id = `${provenance}::relationship::${type}::${sourceId}::${targetId}`;
    if (seenRelationships.has(id)) {
      recordSkip(result, `Skipped duplicate ${type} relationship in source ${source.id}.`);
      continue;
    }
    seenRelationships.add(id);
    const rows = relationshipGroups.get(type) || [];
    rows.push({
      id,
      source: sourceEntity.graphId,
      target: targetEntity.graphId,
      properties: {
        id,
        caseId,
        sourceId: source.id,
        sourceKey: provenance,
        confidence: numberOrNull(relationship.confidence),
        description: cleanText(relationship.description),
        metadata: json(relationship.metadata),
        evidenceReferences: Array.isArray(relationship.evidenceReferences)
          ? relationship.evidenceReferences.filter(Boolean)
          : [],
        importedAt: new Date().toISOString(),
      },
    });
    relationshipGroups.set(type, rows);
    result.relationships += 1;
  }

  // Event and evidence references are also resolved strictly against IDs from
  // the same source; unresolved references are skipped instead of creating nodes.
  const derivedGroups = new Map<string, RelationshipRow[]>();
  const addDerived = (type: string, row: RelationshipRow) => {
    const rows = derivedGroups.get(type) || [];
    if (!rows.some((item) => item.id === row.id)) rows.push(row);
    derivedGroups.set(type, rows);
  };
  for (const event of (Array.isArray(extraction.events) ? extraction.events : []) as ExtractedEvent[]) {
    const eventId = cleanId(event?.id);
    const graphId = eventId ? validEvents.get(eventId) : null;
    if (!eventId || !graphId) continue;
    for (const entityId of Array.isArray(event.entitiesInvolved) ? event.entitiesInvolved : []) {
      const entity = validEntities.get(entityId);
      if (!entity) {
        recordSkip(result, `Skipped event reference to missing entity '${entityId}'.`);
        continue;
      }
      const id = `${provenance}::involved-in::${entityId}::${eventId}`;
      addDerived("INVOLVED_IN", {
        id,
        source: entity.graphId,
        target: graphId,
        properties: { id, caseId, sourceId: source.id, sourceKey: provenance, importedAt: new Date().toISOString() },
      });
      result.relationships += 1;
    }
    const locationId = cleanId(event.location);
    const location = locationId ? validEntities.get(locationId) : null;
    if (location && location.type === "Location") {
      const id = `${provenance}::occurred-at::${eventId}::${locationId}`;
      addDerived("OCCURRED_AT", {
        id,
        source: graphId,
        target: location.graphId,
        properties: { id, caseId, sourceId: source.id, sourceKey: provenance, importedAt: new Date().toISOString() },
      });
      result.relationships += 1;
    }
  }
  for (const evidence of (Array.isArray(extraction.evidenceReferences)
    ? extraction.evidenceReferences
    : []) as ExtractedEvidenceRef[]) {
    const evidenceId = cleanId(evidence?.id);
    const graphId = evidenceId ? validEvidence.get(evidenceId) : null;
    if (!evidenceId || !graphId) continue;
    for (const entityId of Array.isArray(evidence.entitiesReferenced) ? evidence.entitiesReferenced : []) {
      const entity = validEntities.get(entityId);
      if (!entity) {
        recordSkip(result, `Skipped evidence reference to missing entity '${entityId}'.`);
        continue;
      }
      const id = `${provenance}::mentioned-in::${entityId}::${evidenceId}`;
      addDerived("MENTIONED_IN", {
        id,
        source: entity.graphId,
        target: graphId,
        properties: {
          id,
          caseId,
          sourceId: source.id,
          sourceKey: provenance,
          pageOrSection: cleanText(evidence.pageOrSection),
          relevance: cleanText(evidence.relevance),
          importedAt: new Date().toISOString(),
        },
      });
      result.relationships += 1;
    }
  }

  for (const [type, rows] of relationshipGroups) await mergeRelationshipRows(type, rows);
  for (const [type, rows] of derivedGroups) await mergeRelationshipRows(type, rows);
  return result;
}

function combineDiagnostics(target: GraphSyncDiagnostics, source: GraphSyncDiagnostics) {
  target.entities += source.entities;
  target.evidence += source.evidence;
  target.events += source.events;
  target.relationships += source.relationships;
  target.skipped += source.skipped;
  target.errors.push(...source.errors);
}

export async function syncCaseGraph(caseId: string): Promise<GraphSyncDiagnostics> {
  const input = await fetchCaseGraphInputFromDb(caseId);
  if (!input.success || !input.case) throw new Error(input.error || `Case '${caseId}' not found.`);
  await ensureSchema();
  const result = diagnostics();
  await mergeCase(input.case);
  for (const source of input.sources) {
    try {
      combineDiagnostics(result, await syncSourceGraph(input.case, source));
    } catch (error) {
      recordSkip(result, `Unable to synchronize source ${source.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}

export async function syncDataSourceGraph(dataSourceId: string): Promise<GraphSyncDiagnostics> {
  const sourceResult = await fetchDataSourceById(dataSourceId);
  if (!sourceResult.success || !sourceResult.source) {
    throw new Error(sourceResult.error || `Data source '${dataSourceId}' not found.`);
  }
  const input = await fetchCaseGraphInputFromDb(sourceResult.source.case_id);
  if (!input.success || !input.case) throw new Error(input.error || "Case not found.");
  await ensureSchema();
  return syncSourceGraph(input.case, sourceResult.source);
}

function serialiseValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(serialiseValue);
  if (value && typeof value === "object") {
    const candidate = value as { toNumber?: () => number; toString?: () => string };
    if (typeof candidate.toNumber === "function") return candidate.toNumber();
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serialiseValue(item)]));
  }
  return value;
}

function nodeType(labels: string[]): InvestigationNodeType {
  const found = labels.find((label) => label !== "Entity") as InvestigationNodeType | undefined;
  return found || "Case";
}

export async function readCaseGraph(caseId: string): Promise<InvestigationGraphData> {
  const nodeRows = await readQuery<{ node: { labels: string[]; properties: Record<string, unknown> } }>(
    `
      MATCH (c:Case {id: $caseId})
      OPTIONAL MATCH (c)-[:HAS_ENTITY|HAS_EVIDENCE|HAS_EVENT]->(member)
      WITH c, [node IN collect(member) WHERE node IS NOT NULL] AS members
      UNWIND [c] + members AS node
      RETURN DISTINCT node
    `,
    { caseId },
  );
  const edgeRows = await readQuery<{
    relationship: { properties: Record<string, unknown> };
    source: string;
    target: string;
    type: string;
  }>(
    `
      MATCH (c:Case {id: $caseId})
      OPTIONAL MATCH (c)-[:HAS_ENTITY|HAS_EVIDENCE|HAS_EVENT]->(member)
      WITH c, [node IN collect(member) WHERE node IS NOT NULL] AS members
      WITH [c] + members AS graphNodes
      UNWIND graphNodes AS source
      MATCH (source)-[relationship]->(target)
      WHERE target IN graphNodes
      RETURN DISTINCT relationship, source.id AS source, target.id AS target, type(relationship) AS type
    `,
    { caseId },
  );

  const nodes: InvestigationGraphNode[] = nodeRows.map(({ node }) => {
    const properties = serialiseValue(node.properties) as Record<string, unknown>;
    const id = String(properties.id);
    const type = nodeType(node.labels);
    return {
      id,
      type,
      label: String(properties.name || properties.title || properties.excerpt || properties.extractedId || id),
      riskScore: numberOrNull(properties.riskScore) ?? undefined,
      confidence: numberOrNull(properties.confidence) ?? undefined,
      properties,
    };
  });
  const edges: InvestigationGraphEdge[] = edgeRows.map(({ relationship, source, target, type }) => {
    const properties = serialiseValue(relationship.properties) as Record<string, unknown>;
    const id = String(properties.id || `${source}::${type}::${target}`);
    return {
      id,
      source,
      target,
      type,
      label: type.replaceAll("_", " "),
      confidence: numberOrNull(properties.confidence) ?? undefined,
      properties,
    };
  });
  return { nodes, edges };
}

export async function syncAndReadCaseGraph(caseId: string) {
  const sync = await syncCaseGraph(caseId);
  return { graph: await readCaseGraph(caseId), sync };
}

export function isCaseMembershipRelationship(type: string) {
  return CASE_MEMBERSHIP_TYPES.has(type);
}
