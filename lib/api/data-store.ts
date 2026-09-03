import fs from "fs";
import path from "path";
import type {
  CaseDetail,
  CaseSummary,
  CaseStatus,
  Priority,
  Entity,
  EntityType,
  EntityStatus,
  NetworkEntry,
  NetworkRiskLevel,
  GlobalAlert,
  AlertSeverity,
  AlertStatus,
  DataSource,
  SystemPreferences,
  OperatorProfile,
  ActivityLog,
  OverviewTelemetry,
  AIMessage,
  CaseEntity,
  TimelineEvent,
  TimelineEventType,
  Evidence,
  EvidenceType,
  CaseAlert,
  CaseNetwork,
} from "./types";

import type { IntelligenceExtractionResult } from "@/lib/ai/types";
import { allCases } from "@/app/dashboard/cases/data";

// ─── Helper Mappers ─────────────────────────────────────────────────────────

function mapExtractedEntityType(rawType?: string): EntityType {
  const upper = (rawType || "Person").toUpperCase();
  if (upper === "PERSON") return "PERSON";
  if (upper === "ORGANIZATION") return "ORGANIZATION";
  if (upper === "LOCATION") return "LOCATION";
  if (upper === "PHONE") return "PHONE";
  if (upper === "BANKACCOUNT" || upper === "ACCOUNT") return "ACCOUNT";
  if (upper === "VEHICLE") return "VEHICLE";
  return "PERSON";
}

function mapExtractedTimelineType(rawType?: string): TimelineEventType {
  const upper = (rawType || "INTEL").toUpperCase();
  if (["SURVEILLANCE", "FINANCIAL", "COMMUNICATION", "ARREST", "INTEL", "SYSTEM"].includes(upper)) {
    return upper as TimelineEventType;
  }
  if (upper.includes("CALL") || upper.includes("COMM")) return "COMMUNICATION";
  if (upper.includes("BANK") || upper.includes("CASH") || upper.includes("TRANS")) return "FINANCIAL";
  if (upper.includes("RAID") || upper.includes("ARREST") || upper.includes("SEIZ")) return "ARREST";
  if (upper.includes("SIGHT") || upper.includes("CCTV") || upper.includes("SURV")) return "SURVEILLANCE";
  return "INTEL";
}

function mapSourceToEvidenceType(sourceType: string): EvidenceType {
  const upper = (sourceType || "OTHER").toUpperCase();
  if (upper === "FIR" || upper === "REPORT" || upper === "OSINT" || upper === "CUSTOMS") return "DOCUMENT";
  if (upper === "CDR") return "COMMUNICATION";
  if (upper === "FINANCIAL") return "FINANCIAL_RECORD";
  if (upper === "SURVEILLANCE") return "MEDIA";
  return "DOCUMENT";
}

// ─── Disk Persistence Paths ──────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "cases-store.json");

interface PersistedState {
  cases: CaseDetail[];
  networks: NetworkEntry[];
  entities: Entity[];
  alerts: GlobalAlert[];
  dataSources: DataSource[];
  settings?: { preferences: SystemPreferences; operator: OperatorProfile };
  activityLogs: ActivityLog[];
}

const defaultDataSources: DataSource[] = [
  { id: "DS-001", name: "CDRS Feed", type: "Telecommunications", status: "SYNCED", latency: "38ms", records: "0", lastSync: "Just now" },
  { id: "DS-002", name: "Financial Transaction Log", type: "Banking", status: "SYNCED", latency: "55ms", records: "0", lastSync: "Just now" },
  { id: "DS-003", name: "Surveillance CCTV Index", type: "Physical Surveillance", status: "SYNCED", latency: "112ms", records: "0", lastSync: "Just now" },
  { id: "DS-004", name: "FIR Database", type: "Law Enforcement", status: "SYNCED", latency: "29ms", records: "0", lastSync: "Just now" },
  { id: "DS-005", name: "Social Media Harvest", type: "OSINT", status: "SYNCED", latency: "—", records: "0", lastSync: "Just now" },
  { id: "DS-006", name: "Customs & Immigration", type: "Border Control", status: "SYNCED", latency: "76ms", records: "0", lastSync: "Just now" },
];

const defaultSettings = {
  preferences: {
    alertNotifications: true,
    autoSyncDataSources: true,
    crossCaseEntityMatching: true,
    sessionTimeout: false,
  },
  operator: {
    clearanceLevel: "LEVEL 3 — RESTRICTED",
    accessRole: "LEAD INVESTIGATOR",
    jurisdiction: "NATIONAL — ALL ZONES",
    sessionToken: "SYS-TOKEN-••••••••••••",
  },
};

// ─── In-Memory & Persistent Forensic Store ───────────────────────────────────

class ForensicDataStore {
  private cases: CaseDetail[] = [];
  private networks: NetworkEntry[] = [];
  private entities: Entity[] = [];
  private alerts: GlobalAlert[] = [];
  private dataSources: DataSource[] = [...defaultDataSources];
  private settings = { ...defaultSettings };
  private activityLogs: ActivityLog[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        const data: PersistedState = JSON.parse(raw);
        if (data) {
          this.cases = data.cases || [];
          this.networks = data.networks || [];
          this.entities = data.entities || [];
          this.alerts = data.alerts || [];
          this.dataSources = data.dataSources && data.dataSources.length > 0 ? data.dataSources : [...defaultDataSources];
          if (data.settings) this.settings = data.settings;
          this.activityLogs = data.activityLogs || [];
        }
      }
    } catch (err) {
      console.warn("Could not load local data store from disk:", err);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const state: PersistedState = {
        cases: this.cases,
        networks: this.networks,
        entities: this.entities,
        alerts: this.alerts,
        dataSources: this.dataSources,
        settings: this.settings,
        activityLogs: this.activityLogs,
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (err) {
      console.warn("Could not save data store to disk:", err);
    }
  }

  // ── Overview ─────────────────────────────────────────────────────────────
  getOverviewTelemetry(): OverviewTelemetry {
    this.loadFromDisk();
    const activeCasesCount = this.cases.filter((c) => c.status === "ACTIVE").length;
    const totalEntitiesCount = this.entities.length;
    const networksCount = this.networks.length;
    const unreadAlertsCount = this.alerts.filter((a) => a.status === "NEW").length;

    const activeCasesSummaries: CaseSummary[] = this.cases
      .filter((c) => c.status === "ACTIVE")
      .map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        priority: c.priority,
        entities: c.entityCount,
        networks: c.networks.length,
        investigator: c.investigator,
        opened: c.opened,
        updated: c.updated,
        description: c.description,
      }));

    return {
      stats: {
        activeCases: { value: activeCasesCount, delta: `${activeCasesCount} active` },
        totalEntities: { value: totalEntitiesCount, delta: `${totalEntitiesCount} indexed` },
        networks: { value: networksCount, delta: `${networksCount} active rings` },
        alerts: { value: unreadAlertsCount, delta: `${unreadAlertsCount} unread` },
      },
      activeInvestigations: activeCasesSummaries,
      priorityAlerts: this.alerts.slice(0, 4),
      recentActivity: this.activityLogs,
    };
  }

  // ── Cases ────────────────────────────────────────────────────────────────
  getAllCases(status?: CaseStatus | "ALL", search?: string): CaseSummary[] {
    this.loadFromDisk();
    return this.cases
      .filter((c) => {
        const matchesStatus = !status || status === "ALL" || c.status === status;
        const matchesSearch =
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase()) ||
          c.investigator.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        priority: c.priority,
        entities: c.entityCount,
        networks: c.networks.length,
        investigator: c.investigator,
        opened: c.opened,
        updated: c.updated,
        description: c.description,
      }));
  }

  getCaseById(id: string): CaseDetail | undefined {
    this.loadFromDisk();
    const found = this.cases.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (found) return found;
    const seed = allCases.find((c) => c.id.toLowerCase() === id.toLowerCase());
    if (seed) {
      this.cases.push(seed);
      this.saveToDisk();
      return seed;
    }
    return undefined;
  }

  createCase(data: {
    id?: string;
    name: string;
    description: string;
    priority: Priority;
    investigator: string;
    jurisdiction: string;
    classification?: string;
    brief?: string;
  }): CaseDetail {
    this.loadFromDisk();
    const newId = data.id || `CASE-00${String(this.cases.length + 90)}`;
    const newCase: CaseDetail = {
      id: newId,
      name: data.name,
      status: "ACTIVE",
      priority: data.priority,
      description: data.description,
      brief: data.brief || data.description,
      investigator: data.investigator,
      team: [data.investigator],
      opened: new Date().toISOString().split("T")[0],
      updated: "Just now",
      jurisdiction: data.jurisdiction,
      classification: data.classification || "RESTRICTED // LEVEL-2",
      entityCount: 0,
      relationshipCount: 0,
      evidenceCount: 0,
      alertCount: 0,
      aiAssessment: {
        finding: "Initial reconnaissance active. Awaiting evidence ingestion.",
        confidence: 70,
        category: "NEW INGESTION",
      },
      networks: [],
      entities: [],
      timeline: [
        {
          id: `T-001`,
          timestamp: `${new Date().toISOString().split("T")[0]} 09:00`,
          title: "Case Opened",
          description: `Case file created and assigned to ${data.investigator}.`,
          type: "SYSTEM",
        },
      ],
      evidence: [],
      alerts: [],
      aiMessages: [
        {
          id: "M-001",
          role: "ai",
          content: `**Case Initialized**: ${data.name}\n\nAI intelligence monitor standing by for node queries and relationship mapping.`,
          timestamp: "Just now",
        },
      ],
    };
    const existingIdx = this.cases.findIndex((c) => c.id.toLowerCase() === newId.toLowerCase());
    if (existingIdx !== -1) {
      this.cases[existingIdx] = newCase;
    } else {
      this.cases.unshift(newCase);
    }
    this.saveToDisk();
    return newCase;
  }

  createCaseFromExtraction(params: {
    id?: string;
    name?: string;
    priority?: Priority;
    investigator?: string;
    jurisdiction?: string;
    extraction: IntelligenceExtractionResult;
    sourceInfo: {
      id?: string;
      filename: string;
      storagePath: string;
      sourceType: string;
      fileSize?: number;
    };
  }): CaseDetail {
    this.loadFromDisk();
    const { extraction, sourceInfo } = params;
    const newId = params.id || `CASE-00${String(this.cases.length + 90)}`;
    const today = new Date().toISOString().split("T")[0];
    const investigator = params.investigator || "LEAD INVESTIGATOR";

    const caseName =
      params.name ||
      extraction.caseTitle ||
      `Investigation // ${sourceInfo.filename.replace(/\.[^/.]+$/, "")}`;

    // Map extracted entities to CaseEntity format
    const caseEntities: CaseEntity[] = (extraction.entities || []).map((ent, idx) => {
      const entId = ent.id || `E-${1000 + idx}`;
      const mappedType = mapExtractedEntityType(ent.type);
      const score = typeof ent.riskScore === "number" ? ent.riskScore : 70;
      const status: EntityStatus = score >= 75 ? "FLAGGED" : score >= 40 ? "MONITORING" : "CLEARED";
      return {
        id: entId,
        name: ent.name,
        alias: ent.aliases && ent.aliases.length > 0 ? ent.aliases.join(", ") : undefined,
        type: mappedType,
        riskScore: score,
        status,
        lastSeen: today,
      };
    });

    // Register into global entities index
    for (const ent of caseEntities) {
      const existingGlobal = this.entities.find((e) => e.name.toLowerCase() === ent.name.toLowerCase());
      if (existingGlobal) {
        if (!existingGlobal.cases.includes(newId)) existingGlobal.cases.push(newId);
        existingGlobal.riskScore = Math.max(existingGlobal.riskScore, ent.riskScore);
        existingGlobal.lastSeen = today;
      } else {
        this.entities.unshift({
          id: ent.id,
          name: ent.name,
          alias: ent.alias,
          type: ent.type,
          riskScore: ent.riskScore,
          cases: [newId],
          lastSeen: today,
          status: ent.status,
        });
      }
    }

    // Map timeline events
    const timelineEvents: TimelineEvent[] = [
      {
        id: "T-001",
        timestamp: `${today} 09:00`,
        title: "Case Opened / Intelligence Ingested",
        description: `Case file initialized from ${sourceInfo.sourceType} upload (${sourceInfo.filename}). Assigned to ${investigator}.`,
        type: "SYSTEM",
      },
    ];

    if (extraction.events && extraction.events.length > 0) {
      extraction.events.forEach((ev, idx) => {
        timelineEvents.push({
          id: `T-${String(idx + 2).padStart(3, "0")}`,
          timestamp: ev.timestamp || `${today} 12:00`,
          title: ev.title || "Document Event",
          description: ev.description || "",
          type: mapExtractedTimelineType(ev.type),
          relatedEntities: ev.entitiesInvolved || [],
        });
      });
    }

    // Map evidence items
    const primaryEvidenceType = mapSourceToEvidenceType(sourceInfo.sourceType);
    const evidenceItems: Evidence[] = [
      {
        id: `EV-001`,
        title: `Primary ${sourceInfo.sourceType} Dossier — ${sourceInfo.filename}`,
        type: primaryEvidenceType,
        source: `Supabase Vault // ${sourceInfo.sourceType}`,
        dateAdded: today,
        linkedEntities: caseEntities.slice(0, 4).map((e) => e.id),
        description: `Verified intelligence payload (${sourceInfo.filename}). Stored at ${sourceInfo.storagePath} with forensic hash.`,
      },
    ];

    if (extraction.evidenceReferences && extraction.evidenceReferences.length > 0) {
      extraction.evidenceReferences.forEach((ref, idx) => {
        evidenceItems.push({
          id: `EV-${String(idx + 2).padStart(3, "0")}`,
          title: ref.pageOrSection ? `Citation: ${ref.pageOrSection}` : `Evidence Reference #${idx + 1}`,
          type: "DOCUMENT",
          source: sourceInfo.filename,
          dateAdded: today,
          linkedEntities: ref.entitiesReferenced || [],
          description: `"${ref.excerpt}" — ${ref.relevance || "Direct evidence excerpt."}`,
        });
      });
    }

    // Map alerts
    const alerts: CaseAlert[] = [];
    if (extraction.alerts && extraction.alerts.length > 0) {
      extraction.alerts.forEach((alt, idx) => {
        const altId = `ALT-00${String(this.alerts.length + idx + 1).slice(-3)}`;
        const caseAlert: CaseAlert = {
          id: altId,
          title: alt.title,
          description: alt.description,
          severity: alt.severity,
          status: "NEW",
          timestamp: "Just now",
        };
        alerts.push(caseAlert);
        this.alerts.unshift({
          id: altId,
          title: alt.title,
          description: alt.description,
          severity: alt.severity,
          status: "NEW",
          caseId: newId,
          timestamp: "Just now",
        });
      });
    }

    // Default AI Assessment
    const aiAssessment = extraction.aiAssessment || {
      finding: extraction.summary || "Case topology compiled from ingested document. Critical nodes identified.",
      confidence: extraction.confidenceScore || 92,
      category: "INVESTIGATIVE FORENSICS",
    };

    // Default Network Rings
    const networks: CaseNetwork[] = [
      {
        id: `NET-${String(this.networks.length + 1).padStart(3, "0")}`,
        name: `${caseName} Core Ring`,
        nodes: caseEntities.length,
        edges: extraction.relationships?.length || 0,
        riskLevel: params.priority === "HIGH" ? "CRITICAL" : "HIGH",
      },
    ];

    const newCase: CaseDetail = {
      id: newId,
      name: caseName,
      status: "ACTIVE",
      priority: params.priority || "HIGH",
      description: extraction.summary || `Investigation initiated from ${sourceInfo.sourceType} (${sourceInfo.filename}).`,
      brief: extraction.brief || extraction.summary || `Investigation initiated from ${sourceInfo.sourceType} (${sourceInfo.filename}).`,
      investigator,
      team: [investigator, "AI FORENSIC AGENT"],
      opened: today,
      updated: "Just now",
      jurisdiction: extraction.jurisdiction || params.jurisdiction || "NATIONAL",
      classification: extraction.classification || "RESTRICTED // LEVEL-3",
      entityCount: caseEntities.length,
      relationshipCount: extraction.relationships?.length || 0,
      evidenceCount: evidenceItems.length,
      alertCount: alerts.length,
      aiAssessment,
      networks,
      entities: caseEntities,
      timeline: timelineEvents,
      evidence: evidenceItems,
      alerts,
      aiMessages: [
        {
          id: "M-001",
          role: "ai",
          content: `**Case Initialized from ${sourceInfo.sourceType}**: ${caseName}\n\n${aiAssessment.finding}\n\nIndexed ${caseEntities.length} entities, ${timelineEvents.length} timeline occurrences, and ${evidenceItems.length} evidence references.`,
          timestamp: "Just now",
        },
      ],
    };

    const existingIdx = this.cases.findIndex((c) => c.id.toLowerCase() === newId.toLowerCase());
    if (existingIdx !== -1) {
      this.cases[existingIdx] = newCase;
    } else {
      this.cases.unshift(newCase);
    }
    this.saveToDisk();
    return newCase;
  }


  enrichCaseWithExtraction(
    caseId: string,
    extraction: IntelligenceExtractionResult,
    sourceInfo: {
      id?: string;
      filename: string;
      storagePath: string;
      sourceType: string;
      fileSize?: number;
    }
  ): CaseDetail | undefined {
    this.loadFromDisk();
    const targetCase = this.cases.find((c) => c.id.toLowerCase() === caseId.toLowerCase());
    if (!targetCase) return undefined;

    const today = new Date().toISOString().split("T")[0];

    // 1. Update brief and AI assessment
    if (extraction.brief) {
      targetCase.brief = `${targetCase.brief}\n\n[NEW INTEL // ${sourceInfo.sourceType} (${sourceInfo.filename})]: ${extraction.brief}`;
    }
    if (extraction.aiAssessment) {
      targetCase.aiAssessment = extraction.aiAssessment;
    }
    if (extraction.jurisdiction && targetCase.jurisdiction === "NATIONAL") {
      targetCase.jurisdiction = extraction.jurisdiction;
    }

    // 2. Merge entities
    for (const rawEnt of extraction.entities || []) {
      const existingInCase = targetCase.entities.find(
        (e) => e.name.toLowerCase() === rawEnt.name.toLowerCase()
      );
      const mappedType = mapExtractedEntityType(rawEnt.type);
      const score = typeof rawEnt.riskScore === "number" ? rawEnt.riskScore : 70;
      const status: EntityStatus = score >= 75 ? "FLAGGED" : score >= 40 ? "MONITORING" : "CLEARED";

      if (existingInCase) {
        existingInCase.riskScore = Math.max(existingInCase.riskScore, score);
        existingInCase.lastSeen = today;
      } else {
        const entId = rawEnt.id || `E-${1000 + targetCase.entities.length}`;
        const newEntity: CaseEntity = {
          id: entId,
          name: rawEnt.name,
          alias: rawEnt.aliases && rawEnt.aliases.length > 0 ? rawEnt.aliases.join(", ") : undefined,
          type: mappedType,
          riskScore: score,
          status,
          lastSeen: today,
        };
        targetCase.entities.push(newEntity);

        // Also update global entities
        const existingGlobal = this.entities.find((e) => e.name.toLowerCase() === rawEnt.name.toLowerCase());
        if (existingGlobal) {
          if (!existingGlobal.cases.includes(caseId)) existingGlobal.cases.push(caseId);
          existingGlobal.riskScore = Math.max(existingGlobal.riskScore, score);
          existingGlobal.lastSeen = today;
        } else {
          this.entities.unshift({
            id: entId,
            name: rawEnt.name,
            alias: newEntity.alias,
            type: mappedType,
            riskScore: score,
            cases: [caseId],
            lastSeen: today,
            status,
          });
        }
      }
    }

    // 3. Append timeline events
    if (extraction.events && extraction.events.length > 0) {
      extraction.events.forEach((ev) => {
        targetCase.timeline.unshift({
          id: `T-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
          timestamp: ev.timestamp || `${today} 12:00`,
          title: ev.title || "Intelligence Event",
          description: ev.description || "",
          type: mapExtractedTimelineType(ev.type),
          relatedEntities: ev.entitiesInvolved || [],
        });
      });
    }

    // 4. Append Evidence items
    const primaryEvidenceType = mapSourceToEvidenceType(sourceInfo.sourceType);
    targetCase.evidence.unshift({
      id: `EV-${Date.now().toString().slice(-4)}`,
      title: `${sourceInfo.sourceType}: ${sourceInfo.filename}`,
      type: primaryEvidenceType,
      source: `Supabase Vault // ${sourceInfo.sourceType}`,
      dateAdded: today,
      linkedEntities: (extraction.entities || []).slice(0, 4).map((e) => e.id),
      description: `Ingested ${sourceInfo.sourceType} document. Stored at ${sourceInfo.storagePath}.`,
    });

    if (extraction.evidenceReferences && extraction.evidenceReferences.length > 0) {
      extraction.evidenceReferences.forEach((ref) => {
        targetCase.evidence.push({
          id: `EV-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`,
          title: ref.pageOrSection ? `Citation: ${ref.pageOrSection}` : `Evidence Reference`,
          type: "DOCUMENT",
          source: sourceInfo.filename,
          dateAdded: today,
          linkedEntities: ref.entitiesReferenced || [],
          description: `"${ref.excerpt}" — ${ref.relevance || "Direct evidence excerpt."}`,
        });
      });
    }

    // 5. Append Alerts
    if (extraction.alerts && extraction.alerts.length > 0) {
      extraction.alerts.forEach((alt) => {
        const altId = `ALT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;
        const caseAlert: CaseAlert = {
          id: altId,
          title: alt.title,
          description: alt.description,
          severity: alt.severity,
          status: "NEW",
          timestamp: "Just now",
        };
        targetCase.alerts.unshift(caseAlert);
        this.alerts.unshift({
          id: altId,
          title: alt.title,
          description: alt.description,
          severity: alt.severity,
          status: "NEW",
          caseId: caseId,
          timestamp: "Just now",
        });
      });
    }

    // 6. Update counts & timestamp
    targetCase.entityCount = targetCase.entities.length;
    targetCase.relationshipCount += extraction.relationships?.length || 0;
    targetCase.evidenceCount = targetCase.evidence.length;
    targetCase.alertCount = targetCase.alerts.length;
    targetCase.updated = "Just now";

    this.saveToDisk();
    return targetCase;
  }

  updateCase(id: string, updates: Partial<CaseDetail>): CaseDetail | undefined {
    this.loadFromDisk();
    const caseIndex = this.cases.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (caseIndex === -1) return undefined;
    this.cases[caseIndex] = {
      ...this.cases[caseIndex],
      ...updates,
      updated: "Just now",
    };
    this.saveToDisk();
    return this.cases[caseIndex];
  }

  deleteCase(id: string): boolean {
    this.loadFromDisk();
    const beforeLen = this.cases.length;
    this.cases = this.cases.filter((c) => c.id.toLowerCase() !== id.toLowerCase());
    this.saveToDisk();
    return this.cases.length < beforeLen;
  }

  appendAIMessage(caseId: string, userMessage: string): AIMessage | undefined {
    this.loadFromDisk();
    const caseItem = this.getCaseById(caseId);
    if (!caseItem) return undefined;

    const userMsg: AIMessage = {
      id: `M-${String(caseItem.aiMessages.length + 1).padStart(3, "0")}`,
      role: "user",
      content: userMessage,
      timestamp: "Just now",
    };
    caseItem.aiMessages.push(userMsg);

    // Generate response based on prompt
    let responseText = `**Analysis on "${userMessage}"**\n\nCross-referencing entities against case topology. 2 related clusters flagged with high centrality. No conflicting records found.`;
    const lower = userMessage.toLowerCase();
    if (lower.includes("risk")) {
      responseText = `**Risk Evaluation for ${caseItem.name}**\n\nOverall case risk is rated **${caseItem.priority}**. Central entities exhibit high cross-jurisdiction activity with encrypted communications channels.`;
    } else if (lower.includes("lead") || lower.includes("suggest")) {
      responseText = `**Investigative Leads**\n\n1. Analyze outbound communication windows\n2. Query sub-threshold transaction accounts\n3. Cross-link node clusters across active cases`;
    } else if (lower.includes("summarize") || lower.includes("summary")) {
      responseText = `**Executive Brief**\n\n${caseItem.brief}\n\nKey finding: ${caseItem.aiAssessment.finding}`;
    }

    const aiMsg: AIMessage = {
      id: `M-${String(caseItem.aiMessages.length + 1).padStart(3, "0")}`,
      role: "ai",
      content: responseText,
      timestamp: "Just now",
    };
    caseItem.aiMessages.push(aiMsg);
    this.saveToDisk();
    return aiMsg;
  }

  appendInvestigatorTurn(
    caseId: string,
    userMessage: string,
    aiResponse: string
  ): { userMsg: AIMessage; aiMsg: AIMessage } | undefined {
    this.loadFromDisk();
    let caseItem = this.getCaseById(caseId);
    if (!caseItem) {
      return undefined;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const userMsg: AIMessage = {
      id: `M-${String(caseItem.aiMessages.length + 1).padStart(3, "0")}`,
      role: "user",
      content: userMessage,
      timestamp: timeStr,
    };
    caseItem.aiMessages.push(userMsg);

    const aiMsg: AIMessage = {
      id: `M-${String(caseItem.aiMessages.length + 1).padStart(3, "0")}`,
      role: "ai",
      content: aiResponse,
      timestamp: timeStr,
    };
    caseItem.aiMessages.push(aiMsg);

    this.saveToDisk();
    return { userMsg, aiMsg };
  }

  // ── Networks ─────────────────────────────────────────────────────────────
  getAllNetworks(risk?: NetworkRiskLevel | "ALL", search?: string): NetworkEntry[] {
    this.loadFromDisk();
    return this.networks.filter((n) => {
      const matchRisk = !risk || risk === "ALL" || n.risk === risk;
      const matchSearch =
        !search ||
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.id.toLowerCase().includes(search.toLowerCase()) ||
        n.caseId.toLowerCase().includes(search.toLowerCase());
      return matchRisk && matchSearch;
    });
  }

  getNetworkById(id: string): NetworkEntry | undefined {
    this.loadFromDisk();
    return this.networks.find((n) => n.id.toLowerCase() === id.toLowerCase());
  }

  // ── Entities ─────────────────────────────────────────────────────────────
  getAllEntities(params?: {
    type?: EntityType | "ALL";
    status?: EntityStatus | "ALL";
    search?: string;
    sortBy?: "riskScore" | "name" | "lastSeen";
    sortOrder?: "asc" | "desc";
  }): Entity[] {
    this.loadFromDisk();
    const { type, status, search, sortBy = "riskScore", sortOrder = "desc" } = params || {};
    return this.entities
      .filter((e) => {
        const matchType = !type || type === "ALL" || e.type === type;
        const matchStatus = !status || status === "ALL" || e.status === status;
        const matchSearch =
          !search ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.id.toLowerCase().includes(search.toLowerCase()) ||
          (e.alias && e.alias.toLowerCase().includes(search.toLowerCase()));
        return matchType && matchStatus && matchSearch;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "riskScore") cmp = a.riskScore - b.riskScore;
        else if (sortBy === "name") cmp = a.name.localeCompare(b.name);
        else if (sortBy === "lastSeen")
          cmp = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }

  getEntityById(id: string): Entity | undefined {
    this.loadFromDisk();
    return this.entities.find((e) => e.id.toLowerCase() === id.toLowerCase());
  }

  createEntity(data: {
    name: string;
    alias?: string;
    type: EntityType;
    riskScore: number;
    cases?: string[];
    status?: EntityStatus;
  }): Entity {
    this.loadFromDisk();
    const newId = `E-${String(this.entities.length + 1500)}`;
    const newEntity: Entity = {
      id: newId,
      name: data.name,
      alias: data.alias,
      type: data.type,
      riskScore: data.riskScore,
      cases: data.cases || [],
      lastSeen: new Date().toISOString().split("T")[0],
      status: data.status || "MONITORING",
    };
    this.entities.unshift(newEntity);
    this.saveToDisk();
    return newEntity;
  }

  updateEntity(id: string, updates: Partial<Entity>): Entity | undefined {
    this.loadFromDisk();
    const index = this.entities.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return undefined;
    this.entities[index] = { ...this.entities[index], ...updates };
    this.saveToDisk();
    return this.entities[index];
  }

  // ── Alerts ───────────────────────────────────────────────────────────────
  getAllAlerts(params?: {
    severity?: AlertSeverity | "ALL";
    status?: AlertStatus | "ALL";
    caseId?: string;
  }): GlobalAlert[] {
    this.loadFromDisk();
    const { severity, status, caseId } = params || {};
    return this.alerts.filter((a) => {
      const matchSev = !severity || severity === "ALL" || a.severity === severity;
      const matchStat = !status || status === "ALL" || a.status === status;
      const matchCase = !caseId || a.caseId.toLowerCase() === caseId.toLowerCase();
      return matchSev && matchStat && matchCase;
    });
  }

  createAlert(data: {
    title: string;
    description: string;
    severity: AlertSeverity;
    caseId: string;
  }): GlobalAlert {
    this.loadFromDisk();
    const newId = `ALT-${String(this.alerts.length + 100)}`;
    const newAlert: GlobalAlert = {
      id: newId,
      title: data.title,
      description: data.description,
      severity: data.severity,
      status: "NEW",
      caseId: data.caseId,
      timestamp: `${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`,
    };
    this.alerts.unshift(newAlert);
    this.saveToDisk();
    return newAlert;
  }

  updateAlertStatus(id: string, status: AlertStatus): GlobalAlert | undefined {
    this.loadFromDisk();
    const alertItem = this.alerts.find((a) => a.id.toLowerCase() === id.toLowerCase());
    if (!alertItem) return undefined;
    alertItem.status = status;
    this.saveToDisk();
    return alertItem;
  }

  // ── Data Sources ─────────────────────────────────────────────────────────
  getAllDataSources(): DataSource[] {
    this.loadFromDisk();
    return this.dataSources;
  }

  syncDataSources(sourceId?: string): { success: boolean; syncedAt: string; updatedSources: DataSource[] } {
    this.loadFromDisk();
    const timestamp = "Just now";
    if (sourceId) {
      const ds = this.dataSources.find((s) => s.id.toLowerCase() === sourceId.toLowerCase());
      if (ds) {
        ds.status = "SYNCED";
        ds.lastSync = timestamp;
      }
    } else {
      this.dataSources.forEach((s) => {
        if (s.status === "PARTIAL") s.status = "SYNCED";
        s.lastSync = timestamp;
      });
    }
    this.saveToDisk();
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      updatedSources: this.dataSources,
    };
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings() {
    this.loadFromDisk();
    return this.settings;
  }

  updatePreferences(preferences: Partial<SystemPreferences>) {
    this.loadFromDisk();
    this.settings.preferences = {
      ...this.settings.preferences,
      ...preferences,
    };
    this.saveToDisk();
    return this.settings;
  }
}

// Global Singleton Store
export const dataStore = new ForensicDataStore();
