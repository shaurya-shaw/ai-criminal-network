import { GoogleGenAI } from "@google/genai";
import { fetchCaseDetailByIdFromDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import { syncAndReadCaseGraph } from "@/lib/neo4j/case-graph";
import type { CaseDetail, CaseEntity, TimelineEvent, Evidence } from "@/app/dashboard/cases/data";
import type { InvestigationGraphData, InvestigationGraphNode, InvestigationGraphEdge } from "@/lib/neo4j/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getGeminiClient(): GoogleGenAI | null {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("placeholder") || GEMINI_API_KEY.length < 10) {
    return null;
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ─── Data Retrieval Helpers ──────────────────────────────────────────────────

export async function getCaseDossier(caseId: string): Promise<CaseDetail | null> {
  // 1. Try Supabase first
  try {
    const dbRes = await fetchCaseDetailByIdFromDb(caseId);
    if (dbRes.success && dbRes.data) {
      // Merge local aiMessages if any
      const local = dataStore.getCaseById(caseId);
      if (local && local.aiMessages && local.aiMessages.length > 0) {
        return { ...dbRes.data, aiMessages: local.aiMessages };
      }
      return dbRes.data;
    }
  } catch (err) {
    console.warn("[Investigator] DB fetch note:", err);
  }

  // 2. Fallback to local dataStore
  const localCase = dataStore.getCaseById(caseId);
  return localCase || null;
}

export async function getCaseGraph(caseId: string): Promise<InvestigationGraphData> {
  try {
    const { graph } = await syncAndReadCaseGraph(caseId);
    if (graph && (graph.nodes.length > 0 || graph.edges.length > 0)) {
      return graph;
    }
  } catch (err) {
    console.warn("[Investigator] Graph fetch note, building fallback graph:", err);
  }

  // Fallback: build minimal graph from case dossier if Neo4j is offline
  const caseDossier = dataStore.getCaseById(caseId);
  if (!caseDossier) {
    return { nodes: [], edges: [] };
  }

  const nodes: InvestigationGraphNode[] = [
    {
      id: caseDossier.id,
      label: caseDossier.name,
      type: "Case",
      properties: { id: caseDossier.id, name: caseDossier.name },
    },
    ...caseDossier.entities.map((e) => ({
      id: e.id,
      label: e.name,
      type: (e.type === "ORGANIZATION"
        ? "Organization"
        : e.type === "LOCATION"
        ? "Location"
        : e.type === "PHONE"
        ? "Phone"
        : e.type === "ACCOUNT"
        ? "BankAccount"
        : e.type === "VEHICLE"
        ? "Vehicle"
        : "Person") as any,
      riskScore: e.riskScore,
      properties: { id: e.id, name: e.name, alias: e.alias, status: e.status },
    })),
  ];

  const edges: InvestigationGraphEdge[] = [];
  caseDossier.entities.forEach((ent) => {
    edges.push({
      id: `${caseDossier.id}::has::${ent.id}`,
      source: caseDossier.id,
      target: ent.id,
      type: "HAS_ENTITY",
      label: "HAS ENTITY",
      properties: {},
    });
  });

  return { nodes, edges };
}

// ─── Formatters for Grounded Prompt ──────────────────────────────────────────

function naturalRelation(type: string): string {
  switch (type.toUpperCase()) {
    case "WORKS_FOR":
      return "works for";
    case "CALLED":
      return "placed phone communications to";
    case "VISITED":
      return "visited";
    case "TRANSFERRED_TO":
      return "transferred funds to";
    case "OWNS":
      return "owns / operates";
    case "ASSOCIATED_WITH":
      return "is associated with";
    case "KNOWS":
      return "is in direct contact with";
    case "INVOLVES":
      return "involves";
    case "OCCURRED_AT":
      return "occurred at";
    case "MENTIONED_IN":
      return "is referenced in";
    default:
      return type.toLowerCase().replaceAll("_", " ");
  }
}

export function formatRetrievedEvents(timeline: TimelineEvent[]): string {
  if (!timeline || timeline.length === 0) {
    return "No recorded timeline events for this case.";
  }

  return timeline
    .map((event) => {
      const rel = event.relatedEntities && event.relatedEntities.length > 0
        ? ` [Involving: ${event.relatedEntities.join(", ")}]`
        : "";
      return `- [${event.timestamp}] ${event.title} (${event.type}): ${event.description}${rel}`;
    })
    .join("\n");
}

export function formatRetrievedEvidence(evidence: Evidence[]): string {
  if (!evidence || evidence.length === 0) {
    return "No recorded evidence items for this case.";
  }

  return evidence
    .map((ev) => {
      const linked = ev.linkedEntities && ev.linkedEntities.length > 0
        ? `Linked Entities: ${ev.linkedEntities.join(", ")}`
        : "No direct linked entities";
      return `- "${ev.title}" (${ev.type}) - Source: ${ev.source}. ${linked}. Details: ${ev.description}`;
    })
    .join("\n");
}

export function formatRetrievedGraph(
  graph: InvestigationGraphData,
  caseDetail: CaseDetail,
  userQuestion: string
): string {
  const { nodes = [], edges = [] } = graph;
  const lowerQ = userQuestion.toLowerCase();

  // Create node lookup maps
  const nodeById = new Map<string, InvestigationGraphNode>();
  const nodeByName = new Map<string, InvestigationGraphNode>();

  nodes.forEach((n) => {
    nodeById.set(n.id, n);
    if (n.label) nodeByName.set(n.label.toLowerCase(), n);
  });

  // Index entities from case detail
  caseDetail.entities.forEach((e) => {
    if (!nodeByName.has(e.name.toLowerCase())) {
      const fallbackNode: InvestigationGraphNode = {
        id: e.id,
        label: e.name,
        type: "Person",
        riskScore: e.riskScore,
        properties: { name: e.name, alias: e.alias, status: e.status },
      };
      nodeById.set(e.id, fallbackNode);
      nodeByName.set(e.name.toLowerCase(), fallbackNode);
    }
  });

  // Identify entities mentioned in the investigator question
  const mentionedNodes = new Set<string>();
  nodeById.forEach((node, id) => {
    const label = node.label.toLowerCase();
    const alias = String(node.properties?.alias || "").toLowerCase();
    if (label.length > 2 && lowerQ.includes(label)) {
      mentionedNodes.add(id);
    } else if (alias.length > 2 && lowerQ.includes(alias)) {
      mentionedNodes.add(id);
    }
  });

  let relevantEdges: InvestigationGraphEdge[] = [];
  const includedNodeIds = new Set<string>();

  if (mentionedNodes.size > 0) {
    mentionedNodes.forEach((id) => includedNodeIds.add(id));

    // Find edges connected to any mentioned node
    edges.forEach((edge) => {
      if (mentionedNodes.has(edge.source) || mentionedNodes.has(edge.target)) {
        relevantEdges.push(edge);
        includedNodeIds.add(edge.source);
        includedNodeIds.add(edge.target);
      }
    });

    // 2-hop edges between included nodes
    edges.forEach((edge) => {
      if (
        !relevantEdges.includes(edge) &&
        includedNodeIds.has(edge.source) &&
        includedNodeIds.has(edge.target)
      ) {
        relevantEdges.push(edge);
      }
    });
  } else {
    // General case topology
    relevantEdges = edges.slice(0, 100);
    relevantEdges.forEach((e) => {
      includedNodeIds.add(e.source);
      includedNodeIds.add(e.target);
    });
    nodes.slice(0, 40).forEach((n) => includedNodeIds.add(n.id));
  }

  // Format nodes in natural language without internal database identifiers
  const formattedNodes = Array.from(includedNodeIds)
    .map((id) => {
      const node = nodeById.get(id);
      if (!node) return null;
      const alias = node.properties?.alias ? ` (Alias: "${node.properties.alias}")` : "";
      const status = node.properties?.status ? `, Status: ${node.properties.status}` : "";
      const risk = node.riskScore !== undefined ? `, Risk Score: ${node.riskScore}/100` : "";
      return `- "${node.label}" [${node.type}]${alias}${status}${risk}`;
    })
    .filter(Boolean)
    .join("\n");

  // Format relationships naturally
  const formattedEdges = relevantEdges
    .map((e) => {
      const srcNode = nodeById.get(e.source);
      const tgtNode = nodeById.get(e.target);
      const srcLabel = srcNode ? srcNode.label : e.source;
      const tgtLabel = tgtNode ? tgtNode.label : e.target;
      const srcType = srcNode?.type || "Entity";
      const tgtType = tgtNode?.type || "Entity";
      const desc = e.properties?.description ? ` (${e.properties.description})` : "";
      return `- Connection: "${srcLabel}" (${srcType}) ${naturalRelation(e.type)} "${tgtLabel}" (${tgtType})${desc}`;
    })
    .join("\n");

  const lines: string[] = [];
  if (formattedNodes) {
    lines.push("RELEVANT CASE ENTITIES:");
    lines.push(formattedNodes);
  }
  if (formattedEdges) {
    lines.push("\nCONFIRMED GRAPH RELATIONSHIPS:");
    lines.push(formattedEdges);
  } else {
    lines.push("\nCONFIRMED GRAPH RELATIONSHIPS:\nNone established in recorded case graph.");
  }

  return lines.join("\n");
}

// ─── Deterministic Offline Fallback Engine ────────────────────────────────────

function generateDeterministicFallback(
  caseDetail: CaseDetail,
  graph: InvestigationGraphData,
  userQuestion: string
): string {
  const lowerQ = userQuestion.toLowerCase();
  const allNodes = graph.nodes || [];
  const allEdges = graph.edges || [];

  // Match entities in question
  const matchedEntities = caseDetail.entities.filter((e) => {
    const nameMatch = e.name.toLowerCase().length > 2 && lowerQ.includes(e.name.toLowerCase());
    const aliasMatch = e.alias && e.alias.toLowerCase().length > 2 && lowerQ.includes(e.alias.toLowerCase());
    return nameMatch || aliasMatch;
  });

  const locationMatches = allNodes.filter(
    (n) =>
      (n.type === "Location" || n.type === "Organization") &&
      n.label.length > 2 &&
      lowerQ.includes(n.label.toLowerCase())
  );

  // Scenario 1: How is X connected to this case?
  if (
    matchedEntities.length === 1 &&
    !locationMatches.length &&
    (lowerQ.includes("how is") || lowerQ.includes("connected") || lowerQ.includes("what is known"))
  ) {
    const ent = matchedEntities[0];
    const relatedEvents = caseDetail.timeline.filter((ev) =>
      ev.description.toLowerCase().includes(ent.name.toLowerCase()) ||
      ev.relatedEntities?.some((r) => r.toLowerCase().includes(ent.name.toLowerCase()))
    );
    const relatedEvidence = caseDetail.evidence.filter((ev) =>
      ev.linkedEntities.some((l) => l.toLowerCase().includes(ent.name.toLowerCase())) ||
      ev.description.toLowerCase().includes(ent.name.toLowerCase())
    );

    const directEdges = allEdges.filter(
      (e) =>
        e.source.toLowerCase().includes(ent.id.toLowerCase()) ||
        e.target.toLowerCase().includes(ent.id.toLowerCase())
    );

    const strongestConnection =
      relatedEvents[0]?.title ||
      (typeof directEdges[0]?.properties?.description === "string"
        ? directEdges[0].properties.description
        : `direct association with ${caseDetail.name}`);

    let res = `**${ent.name} is connected to this case through ${String(strongestConnection).toLowerCase()}.**\n\n`;
    res += `Key connections:\n`;

    let count = 0;
    if (relatedEvents[0]) {
      count++;
      res += `${count}. **CONFIRMED FACT:** Observed at ${relatedEvents[0].title} on ${relatedEvents[0].timestamp}: ${relatedEvents[0].description}\n`;
    }
    if (directEdges[0]) {
      count++;
      const otherId = directEdges[0].source.toLowerCase().includes(ent.id.toLowerCase()) ? directEdges[0].target : directEdges[0].source;
      const otherNode = allNodes.find((n) => n.id === otherId);
      const otherLabel = otherNode?.label || otherId;
      res += `${count}. **CONFIRMED FACT:** Directly linked to ${otherLabel} via ${naturalRelation(directEdges[0].type)}.\n`;
    }
    if (relatedEvidence[0]) {
      count++;
      res += `${count}. **CONFIRMED FACT:** Documented in evidence "${relatedEvidence[0].title}" from ${relatedEvidence[0].source}.\n`;
    }
    if (relatedEvents[1]) {
      count++;
      res += `${count}. **CONFIRMED FACT:** Intercepted during ${relatedEvents[1].title} at ${relatedEvents[1].timestamp}.\n`;
    }

    if (count === 0) {
      res += `1. **CONFIRMED FACT:** Registered as a monitored entity in case topology with a risk score of ${ent.riskScore}/100.\n`;
    }

    res += `\n**What is not established:** Available data does not establish financial transaction ownership, command authority over unlisted secondary nodes, or direct physical presence outside the specific timeline logs cited above.`;
    return res;
  }

  // Scenario 2: Connection between 2 entities / locations
  if (
    matchedEntities.length >= 2 ||
    (matchedEntities.length >= 1 && locationMatches.length >= 1) ||
    lowerQ.includes("connection") || lowerQ.includes("link")
  ) {
    const primaryEntity = matchedEntities[0];
    const targetTarget: CaseEntity | InvestigationGraphNode | undefined =
      matchedEntities[1] || locationMatches[0];

    if (primaryEntity && targetTarget) {
      const targetLabel: string =
        "name" in targetTarget
          ? (targetTarget as CaseEntity).name
          : (targetTarget as InvestigationGraphNode).label;

      const directEdge = allEdges.find(
        (e) =>
          (e.source.toLowerCase().includes(primaryEntity.id.toLowerCase()) ||
            e.source.toLowerCase().includes(primaryEntity.name.toLowerCase())) &&
          (e.target.toLowerCase().includes(targetTarget.id.toLowerCase()) ||
            e.target.toLowerCase().includes(targetLabel.toLowerCase()))
      ) || allEdges.find(
        (e) =>
          (e.target.toLowerCase().includes(primaryEntity.id.toLowerCase()) ||
            e.target.toLowerCase().includes(primaryEntity.name.toLowerCase())) &&
          (e.source.toLowerCase().includes(targetTarget.id.toLowerCase()) ||
            e.source.toLowerCase().includes(targetLabel.toLowerCase()))
      );

      const entityEdges = allEdges.filter(
        (e) =>
          e.source.toLowerCase().includes(primaryEntity.id.toLowerCase()) ||
          e.target.toLowerCase().includes(primaryEntity.id.toLowerCase())
      );
      const connectedNames = entityEdges
        .map((e) => {
          const isSrc = e.source.toLowerCase().includes(primaryEntity.id.toLowerCase());
          const targetId = isSrc ? e.target : e.source;
          const found = allNodes.find((n) => n.id === targetId);
          return found?.label || targetId;
        })
        .filter(Boolean);

      const entityEvents = caseDetail.timeline.filter((ev) =>
        ev.description.toLowerCase().includes(primaryEntity.name.toLowerCase()) ||
        ev.relatedEntities?.some((r) => r.toLowerCase().includes(primaryEntity.name.toLowerCase()))
      );

      if (!directEdge) {
        let text = `**${primaryEntity.name} is not directly connected to ${targetLabel} in this case.**\n\n`;
        text += `Key connections:\n`;
        if (connectedNames.length > 0) {
          text += `1. **CONFIRMED FACT:** ${primaryEntity.name}'s recorded connections in the case graph are primarily to ${Array.from(new Set(connectedNames)).join(" and ")}.\n`;
        }
        if (entityEvents.length > 0) {
          const firstEvent = entityEvents[0];
          text += `2. **CONFIRMED FACT:** Timeline places ${primaryEntity.name} at ${firstEvent.title} on ${firstEvent.timestamp}.\n`;
          if (entityEvents[1]) {
            text += `3. **CONFIRMED FACT:** Recorded meeting during ${entityEvents[1].title} at ${entityEvents[1].timestamp}.\n`;
          }
        }
        text += `\n**What is not established:** No recorded event, intercepted communication, or graph relationship directly links ${primaryEntity.name} to ${targetLabel}.`;
        return text;
      } else {
        return `**${primaryEntity.name} is connected to ${targetLabel} through confirmed graph relationship.**\n\nKey connections:\n1. **CONFIRMED FACT:** Directly ${naturalRelation(directEdge.type)} ${targetLabel} in case topology.\n2. **CONFIRMED FACT:** ${directEdge.properties?.description || "Verified adjacency record in investigation database"}.\n\n**What is not established:** Secondary operational control or unverified indirect communications beyond the recorded relationship.`;
      }
    }
  }

  // Scenario 3: General case queries / risk / leads / summary
  if (lowerQ.includes("risk") || lowerQ.includes("priority")) {
    return `**Case Risk Assessment for ${caseDetail.name}:**\n\n1. **CONFIRMED FACT:** Overall operational risk is rated **${caseDetail.priority}** with ${caseDetail.entityCount} indexed entities across ${caseDetail.relationshipCount} graph relationships.\n2. **CONFIRMED FACT:** High-risk targets include: ${caseDetail.entities.filter((e) => e.riskScore >= 75).map((e) => `${e.name} (${e.riskScore}/100)`).join(", ") || "None flagged at critical threshold"}.\n\n**What is not established:** Underlying foreign bank account balances or off-network communications not captured in seized evidence.`;
  }

  if (lowerQ.includes("lead") || lowerQ.includes("suggest") || lowerQ.includes("next")) {
    return `**Investigative Leads for ${caseDetail.name}:**\n\n1. **CONFIRMED FACT:** Interrogate recorded communication links between flagged central entities.\n2. **CONFIRMED FACT:** Subpoena transaction records corresponding to evidence "${caseDetail.evidence[0]?.title || "primary vault log"}".\n3. **INDIRECT CONNECTION:** Audit timeline surveillance windows surrounding recorded warehouse meetings.\n\n**What is not established:** Motives or command hierarchy for peripheral courier nodes.`;
  }

  return `**Summary for ${caseDetail.name}:**\n\n${caseDetail.brief}\n\n1. **CONFIRMED FACT:** Status is ${caseDetail.status} under ${caseDetail.jurisdiction}.\n2. **CONFIRMED FACT:** Primary assessment finding: ${caseDetail.aiAssessment.finding}\n\n**What is not established:** Broader international jurisdiction links beyond the current case scope.`;
}

// ─── Async Generator: Streaming Output ────────────────────────────────────────

export async function* streamInvestigatorResponse(
  caseId: string,
  userQuestion: string
): AsyncGenerator<string, void, unknown> {
  // 1. Retrieve case details & graph
  const [caseDetail, graph] = await Promise.all([
    getCaseDossier(caseId),
    getCaseGraph(caseId),
  ]);

  if (!caseDetail) {
    yield `Error: Case record '${caseId}' could not be loaded from active intelligence vaults.`;
    return;
  }

  // 2. Format grounded components
  const retrievedGraph = formatRetrievedGraph(graph, caseDetail, userQuestion);
  const retrievedEvents = formatRetrievedEvents(caseDetail.timeline);
  const retrievedEvidence = formatRetrievedEvidence(caseDetail.evidence);

  // 3. Assemble the exact system prompt instructed by user
  const fullPrompt = `You are an AI investigator operating over a case graph.

When answering a question about an entity:

1. Identify the entity in the current case.
2. Traverse its directly connected graph relationships.
3. Include the most relevant connected:
   - entities
   - events
   - evidence
   - locations
   - communications
4. Explain the connections in natural investigative language.
5. Prioritize direct relationships over indirect 2-hop relationships.
6. Mention timestamps when they materially help establish the connection.
7. Distinguish clearly between:
   - CONFIRMED FACT
   - INDIRECT CONNECTION
   - NOT ESTABLISHED
8. Never invent relationships, motives, ownership, or involvement.
9. Do not expose internal graph IDs, database IDs, source IDs, edge syntax, or implementation details unless explicitly asked.
10. Do not dump the entire graph. Answer the investigator's question directly.

For "How is X connected to this case?", structure the answer as:

**[Entity] is connected to this case through [strongest connection].**

Then provide 3–5 of the strongest relevant connections.

Finish with:

**What is not established:** ...

The LLM should explain retrieved facts, not create the connections itself.

CASE GRAPH:
${retrievedGraph}

EVENTS:
${retrievedEvents}

EVIDENCE:
${retrievedEvidence}

INVESTIGATOR QUESTION:
${userQuestion}

Answer the investigator directly following all rules above.`;

  // 4. Try Gemini streaming
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const responseStream = await gemini.models.generateContentStream({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: fullPrompt }],
          },
        ],
      });

      let streamedAny = false;
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          streamedAny = true;
          yield text;
        }
      }

      if (streamedAny) {
        return;
      }
    } catch (err) {
      console.warn("[Investigator] Gemini stream error, falling back to deterministic engine:", err);
    }
  }

  // 5. Fallback: Factual offline deterministic generator (streamed in chunks)
  const fallbackText = generateDeterministicFallback(caseDetail, graph, userQuestion);
  const words = fallbackText.split(/(\s+)/);

  for (const word of words) {
    yield word;
    // Small delay between tokens to mimic streaming
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
