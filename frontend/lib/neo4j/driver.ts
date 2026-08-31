import neo4j, { Driver, Session } from "neo4j-driver";

function cleanUri(raw: string): string {
  let cleaned = (raw || "").trim();
  if (cleaned.startsWith("NEO4J_URI=")) {
    cleaned = cleaned.substring("NEO4J_URI=".length);
  }
  return cleaned.replace(/^["']|["']$/g, "").trim();
}

const rawUri = process.env.NEO4J_URI || "";

const NEO4J_URI = cleanUri(rawUri);

const NEO4J_USERNAME = process.env.NEO4J_USERNAME || "neo4j";

const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "";

// ─── Singleton Driver Instance ───────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __neo4jDriver__: Driver | undefined;
}

export function getNeo4jDriver(): Driver | null {
  if (!NEO4J_URI || !NEO4J_PASSWORD) {
    return null;
  }

  try {
    if (process.env.NODE_ENV === "production") {
      return neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
      );
    }

    if (!global.__neo4jDriver__) {
      global.__neo4jDriver__ = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
      );
    }

    return global.__neo4jDriver__;
  } catch (err) {
    console.error("Failed to initialize Neo4j driver:", err);
    return null;
  }
}

// ─── Query Helper Wrappers ───────────────────────────────────────────────────

export async function withSession<T>(
  callback: (session: Session) => Promise<T>,
  mode: "READ" | "WRITE" = "READ"
): Promise<T> {
  const driver = getNeo4jDriver();
  if (!driver) {
    throw new Error(
      "Neo4j driver is not configured. Please set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your .env file."
    );
  }

  const database = process.env.NEO4J_DATABASE || undefined;

  const session = driver.session({
    database,
    defaultAccessMode:
      mode === "READ"
        ? neo4j.session.READ
        : neo4j.session.WRITE,
  });

  try {
    return await callback(session);
  } finally {
    await session.close();
  }
}

export async function readQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession(async (session) => {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  }, "READ");
}

export async function writeQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  return withSession(async (session) => {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  }, "WRITE");
}

// ─── Health & Connection Verification ────────────────────────────────────────

export interface Neo4jConnectionStatus {
  connected: boolean;
  configured: boolean;
  uri?: string;
  serverInfo?: {
    agent?: string;
    protocolVersion?: string;
    address?: string;
  };
  stats?: {
    nodeCount: number;
    relationshipCount: number;
  };
  error?: string;
}

export async function verifyNeo4jConnection(): Promise<Neo4jConnectionStatus> {
  const driver = getNeo4jDriver();
  if (!driver) {
    return {
      connected: false,
      configured: false,
      error: "Neo4j environment variables (NEO4J_URI / NEO4J_PASSWORD) are not set.",
    };
  }

  try {
    const serverInfo = await driver.getServerInfo();

    // Query node and relationship counts
    let nodeCount = 0;
    let relationshipCount = 0;

    try {
      const counts = await readQuery<{ nodes: any; rels: any }>(
        `CALL { MATCH (n) RETURN count(n) AS nodes } CALL { MATCH ()-[r]->() RETURN count(r) AS rels } RETURN nodes, rels`
      );
      if (counts.length > 0) {
        const rawNodes = counts[0].nodes;
        const rawRels = counts[0].rels;
        nodeCount = typeof rawNodes === "number" ? rawNodes : (rawNodes?.low ?? 0);
        relationshipCount = typeof rawRels === "number" ? rawRels : (rawRels?.low ?? 0);
      }
    } catch {
      // Counts query failure is non-fatal for connectivity check
    }

    return {
      connected: true,
      configured: true,
      uri: NEO4J_URI.replace(/\/\/.*@/, "//***@"),
      serverInfo: {
        agent: serverInfo.agent,
        protocolVersion:
          serverInfo.protocolVersion != null
            ? String(serverInfo.protocolVersion)
            : undefined,
        address: serverInfo.address,
      },
      stats: {
        nodeCount,
        relationshipCount,
      },
    };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      uri: NEO4J_URI.replace(/\/\/.*@/, "//***@"),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ─── Schema Migration Initializer ────────────────────────────────────────────

const SCHEMA_STATEMENTS = [
  // Constraints
  `CREATE CONSTRAINT case_id_unique IF NOT EXISTS FOR (c:Case) REQUIRE c.id IS UNIQUE`,
  `CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE`,
  `CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE`,
  `CREATE CONSTRAINT organization_id_unique IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE`,
  `CREATE CONSTRAINT location_id_unique IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE`,
  `CREATE CONSTRAINT phone_id_unique IF NOT EXISTS FOR (ph:Phone) REQUIRE ph.id IS UNIQUE`,
  `CREATE CONSTRAINT vehicle_id_unique IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.id IS UNIQUE`,
  `CREATE CONSTRAINT bank_account_id_unique IF NOT EXISTS FOR (b:BankAccount) REQUIRE b.id IS UNIQUE`,
  `CREATE CONSTRAINT evidence_id_unique IF NOT EXISTS FOR (ev:Evidence) REQUIRE ev.id IS UNIQUE`,
  `CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (et:Event) REQUIRE et.id IS UNIQUE`,

  // Indexes
  `CREATE INDEX entity_name_idx IF NOT EXISTS FOR (e:Entity) ON (e.name)`,
  `CREATE INDEX entity_risk_idx IF NOT EXISTS FOR (e:Entity) ON (e.riskScore)`,
  `CREATE INDEX entity_status_idx IF NOT EXISTS FOR (e:Entity) ON (e.status)`,
  `CREATE INDEX case_status_idx IF NOT EXISTS FOR (c:Case) ON (c.status)`,
  `CREATE INDEX case_priority_idx IF NOT EXISTS FOR (c:Case) ON (c.priority)`,
  `CREATE INDEX phone_number_idx IF NOT EXISTS FOR (ph:Phone) ON (ph.number)`,
  `CREATE INDEX vehicle_plate_idx IF NOT EXISTS FOR (v:Vehicle) ON (v.licensePlate)`,
  `CREATE INDEX account_number_idx IF NOT EXISTS FOR (b:BankAccount) ON (b.accountNumber)`,
  `CREATE INDEX event_timestamp_idx IF NOT EXISTS FOR (et:Event) ON (et.timestamp)`,
  `CREATE INDEX evidence_type_idx IF NOT EXISTS FOR (ev:Evidence) ON (ev.evidenceType)`,
  `CREATE INDEX entity_case_source_idx IF NOT EXISTS FOR (e:Entity) ON (e.caseId, e.sourceKey)`,
  `CREATE INDEX evidence_case_source_idx IF NOT EXISTS FOR (ev:Evidence) ON (ev.caseId, ev.sourceKey)`,
  `CREATE INDEX event_case_source_idx IF NOT EXISTS FOR (et:Event) ON (et.caseId, et.sourceKey)`,
];

export async function initializeNeo4jSchema(): Promise<{
  success: boolean;
  executedStatements: number;
  results: { statement: string; status: "SUCCESS" | "FAILED"; error?: string }[];
}> {
  const results: { statement: string; status: "SUCCESS" | "FAILED"; error?: string }[] = [];

  for (const stmt of SCHEMA_STATEMENTS) {
    try {
      await writeQuery(stmt);
      results.push({ statement: stmt, status: "SUCCESS" });
    } catch (err) {
      results.push({
        statement: stmt,
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const success = results.every((r) => r.status === "SUCCESS");
  return {
    success,
    executedStatements: results.length,
    results,
  };
}

export default getNeo4jDriver();
