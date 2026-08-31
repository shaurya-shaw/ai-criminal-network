// Shared mock data for case list and case detail pages

export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type CaseStatus = "ACTIVE" | "CLOSED" | "PENDING";
export type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "LOCATION"
  | "PHONE"
  | "ACCOUNT"
  | "VEHICLE";
export type EntityStatus = "FLAGGED" | "MONITORING" | "CLEARED";

export type TimelineEventType =
  | "SURVEILLANCE"
  | "FINANCIAL"
  | "COMMUNICATION"
  | "ARREST"
  | "INTEL"
  | "SYSTEM";
export type EvidenceType =
  | "DOCUMENT"
  | "FINANCIAL_RECORD"
  | "COMMUNICATION"
  | "MEDIA"
  | "PHYSICAL";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertStatus = "NEW" | "ACKNOWLEDGED" | "RESOLVED";

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
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
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

const CASE_0091: CaseDetail = {
  id: "CASE-0091",
  name: "Operation Black Web",
  status: "ACTIVE",
  priority: "HIGH",
  description:
    "Deep web marketplace network linked to narcotics and weapon distribution across 4 states.",
  brief:
    "Operation Black Web is a multi-agency investigation into an encrypted dark web marketplace facilitating narcotics, weapons, and counterfeit documents across Maharashtra, Delhi, Punjab, and Rajasthan. The network operates through a layered anonymization infrastructure and uses cryptocurrency for settlements. Intelligence suggests a centralized command node operating out of Mumbai with regional distribution cells.",
  investigator: "AGENT SHARMA",
  team: ["AGENT SHARMA", "AGENT REDDY", "AGENT NAIR", "ANALYST JOSHI"],
  opened: "2026-07-14",
  updated: "2h ago",
  jurisdiction: "NATIONAL — MH, DL, PB, RJ",
  classification: "RESTRICTED // LEVEL-3",
  entityCount: 43,
  relationshipCount: 118,
  evidenceCount: 27,
  alertCount: 5,
  aiAssessment: {
    finding:
      "Entity E-0774 (Rajan Mehra) shows centrality metrics consistent with a network coordinator role — 94% confidence of command-level involvement.",
    confidence: 94,
    category: "NETWORK CENTRALITY",
  },
  networks: [
    {
      id: "NET-001",
      name: "Black Web Core Ring",
      nodes: 43,
      edges: 118,
      riskLevel: "CRITICAL",
    },
    {
      id: "NET-002",
      name: "Courier Sub-Network",
      nodes: 12,
      edges: 29,
      riskLevel: "HIGH",
    },
  ],
  entities: [
    {
      id: "E-1482",
      name: "Arjun Rawat",
      alias: "AJ",
      type: "PERSON",
      riskScore: 94,
      status: "FLAGGED",
      lastSeen: "2026-08-29",
    },
    {
      id: "E-0774",
      name: "Rajan Mehra",
      alias: "The Broker",
      type: "PERSON",
      riskScore: 91,
      status: "FLAGGED",
      lastSeen: "2026-08-28",
    },
    {
      id: "E-0941",
      name: "+91-98765-43210",
      type: "PHONE",
      riskScore: 62,
      status: "MONITORING",
      lastSeen: "2026-08-25",
    },
    {
      id: "E-1188",
      name: "Shadow Vault Ltd.",
      type: "ORGANIZATION",
      riskScore: 85,
      status: "FLAGGED",
      lastSeen: "2026-08-27",
    },
    {
      id: "E-1340",
      name: "BTC Wallet 0x4f8...c3a",
      type: "ACCOUNT",
      riskScore: 77,
      status: "MONITORING",
      lastSeen: "2026-08-26",
    },
    {
      id: "E-0610",
      name: "Amritsar Warehouse, Block 4",
      type: "LOCATION",
      riskScore: 78,
      status: "MONITORING",
      lastSeen: "2026-08-22",
    },
  ],
  timeline: [
    {
      id: "T-001",
      timestamp: "2026-07-14 09:00",
      title: "Case Opened",
      description:
        "Initial intelligence received from CDRS analysis. Case file created and assigned to Agent Sharma.",
      type: "SYSTEM",
    },
    {
      id: "T-002",
      timestamp: "2026-07-18 14:32",
      title: "First Surveillance Contact",
      description:
        "Physical surveillance team established visual on Arjun Rawat (E-1482) at Amritsar Warehouse, Block 4.",
      type: "SURVEILLANCE",
      relatedEntities: ["E-1482", "E-0610"],
    },
    {
      id: "T-003",
      timestamp: "2026-07-24 11:15",
      title: "Cryptocurrency Trace Initiated",
      description:
        "Blockchain analysis unit flagged BTC Wallet 0x4f8...c3a with ₹2.1CR in unattributed inflows over 30 days.",
      type: "FINANCIAL",
      relatedEntities: ["E-1340"],
    },
    {
      id: "T-004",
      timestamp: "2026-08-02 08:44",
      title: "Communication Intercept",
      description:
        "Encrypted communication between E-1482 and E-0774 intercepted. Content partially decoded — references to 'shipment D4'.",
      type: "COMMUNICATION",
      relatedEntities: ["E-1482", "E-0774"],
    },
    {
      id: "T-005",
      timestamp: "2026-08-10 19:20",
      title: "Shadow Vault Ltd. Flagged",
      description:
        "Financial intelligence links Shadow Vault Ltd. to three shell companies receiving transfers from flagged accounts.",
      type: "FINANCIAL",
      relatedEntities: ["E-1188"],
    },
    {
      id: "T-006",
      timestamp: "2026-08-17 03:15",
      title: "Intel: Supplier Identity",
      description:
        "Source DELTA-7 confirms Rajan Mehra (E-0774) is acting as primary coordinator between dark web marketplace and physical distribution network.",
      type: "INTEL",
      relatedEntities: ["E-0774"],
    },
    {
      id: "T-007",
      timestamp: "2026-08-22 16:00",
      title: "Network Anomaly Detected",
      description:
        "Automated system flagged unusual spike in connections from E-1482. Three new previously unknown nodes identified.",
      type: "SYSTEM",
      relatedEntities: ["E-1482"],
    },
    {
      id: "T-008",
      timestamp: "2026-08-29 13:48",
      title: "High Priority Alert Triggered",
      description:
        "Network topology engine detected new cross-border connection. Alert escalated to lead investigator.",
      type: "SURVEILLANCE",
    },
  ],
  evidence: [
    {
      id: "EV-001",
      title: "CDRS Communication Log – July 2026",
      type: "COMMUNICATION",
      source: "CDRS Feed – DS-001",
      dateAdded: "2026-07-20",
      linkedEntities: ["E-1482", "E-0941"],
      description:
        "28 days of call detail records showing communication pattern between key entities.",
    },
    {
      id: "EV-002",
      title: "BTC Transaction History",
      type: "FINANCIAL_RECORD",
      source: "Blockchain Analysis Unit",
      dateAdded: "2026-07-25",
      linkedEntities: ["E-1340", "E-1188"],
      description:
        "Cryptocurrency transaction ledger with ₹2.1CR unattributed inflows flagged.",
    },
    {
      id: "EV-003",
      title: "Surveillance Footage – Amritsar Warehouse",
      type: "MEDIA",
      source: "CCTV Index – DS-003",
      dateAdded: "2026-07-19",
      linkedEntities: ["E-1482", "E-0610"],
      description:
        "72 hours of footage capturing entity movement at Warehouse Block 4.",
    },
    {
      id: "EV-004",
      title: "Encrypted Message Partial Decode",
      type: "DOCUMENT",
      source: "SIGINT Unit",
      dateAdded: "2026-08-03",
      linkedEntities: ["E-1482", "E-0774"],
      description:
        "Partially decoded encrypted communication referencing 'shipment D4' and delivery coordinates.",
    },
    {
      id: "EV-005",
      title: "Shadow Vault Ltd. Incorporation Docs",
      type: "DOCUMENT",
      source: "MCA Registry",
      dateAdded: "2026-08-11",
      linkedEntities: ["E-1188"],
      description:
        "Company incorporation documents listing E-0774 as a silent director via nominee arrangement.",
    },
    {
      id: "EV-006",
      title: "Seized Physical Sample – Batch D4",
      type: "PHYSICAL",
      source: "Field Team ALPHA",
      dateAdded: "2026-08-20",
      linkedEntities: ["E-0610"],
      description:
        "Physical evidence collected from Amritsar Warehouse – 4.2kg controlled substance, forensic analysis pending.",
    },
  ],
  alerts: [
    {
      id: "ALT-0091",
      title: "Network anomaly detected",
      description:
        "Unusual spike in connection requests from entity E-1482 across 3 nodes in cluster B. Possible lateral movement.",
      severity: "CRITICAL",
      status: "NEW",
      timestamp: "2026-08-29 13:48 UTC",
    },
    {
      id: "ALT-0090",
      title: "High-risk entity flagged",
      description:
        "Entity E-0774 matched against cross-case correlation engine. Appears in 3 active cases.",
      severity: "CRITICAL",
      status: "NEW",
      timestamp: "2026-08-29 13:21 UTC",
    },
    {
      id: "ALT-0088",
      title: "New connection established",
      description:
        "Previously unknown entity added connection to Rajan Mehra (E-0774). Entity ID pending assignment.",
      severity: "WARNING",
      status: "ACKNOWLEDGED",
      timestamp: "2026-08-29 11:44 UTC",
    },
    {
      id: "ALT-0085",
      title: "Crypto wallet activity",
      description:
        "BTC Wallet 0x4f8...c3a recorded outbound transaction of ₹0.8CR to unknown address.",
      severity: "WARNING",
      status: "ACKNOWLEDGED",
      timestamp: "2026-08-28 22:30 UTC",
    },
    {
      id: "ALT-0081",
      title: "CDRS sync gap resolved",
      description:
        "18-minute data gap in CDRS feed now recovered. No records missing.",
      severity: "INFO",
      status: "RESOLVED",
      timestamp: "2026-08-27 08:00 UTC",
    },
  ],
  aiMessages: [
    {
      id: "M-001",
      role: "ai",
      content:
        "**Case Analysis: Operation Black Web**\n\nInitial graph analysis reveals a hub-and-spoke topology with Rajan Mehra (E-0774) at the center, maintaining connections to 14 distinct entities across 3 geographic clusters. This centrality pattern is consistent with a network coordinator or broker role.\n\nKey finding: E-0774 and E-1482 share 4 overlapping communication windows with encrypted BTC wallet activity — suggesting coordinated operational timing.",
      timestamp: "2026-08-29 09:00",
    },
    {
      id: "M-002",
      role: "ai",
      content:
        "**Risk Assessment**\n\nOverall network risk score: **91/100 — CRITICAL**\n\n- Rajan Mehra (E-0774): 91 — suspected command role\n- Arjun Rawat (E-1482): 94 — most active node\n- Shadow Vault Ltd. (E-1188): 85 — financial conduit\n\nRecommended immediate action: Physical surveillance escalation on E-0774 and financial freeze request on E-1188.",
      timestamp: "2026-08-29 09:01",
    },
    {
      id: "M-003",
      role: "ai",
      content:
        "**Suggested Investigative Leads**\n\n1. Cross-reference BTC Wallet 0x4f8...c3a outbound addresses against known dark web exchange wallets\n2. Request communication records for +91-98765-43210 (E-0941) for August 1–29\n3. Subpoena Shadow Vault Ltd. bank statements from 3 flagged jurisdictions\n4. Identify the 3 new unknown nodes connected to E-1482 in today's anomaly alert",
      timestamp: "2026-08-29 09:02",
    },
  ],
};

const CASE_0092: CaseDetail = {
  id: "CASE-0092",
  name: "Financial Investigation – Offshore",
  status: "ACTIVE",
  priority: "MEDIUM",
  description:
    "Suspected money laundering via shell companies. Offshore accounts flagged in 3 jurisdictions.",
  brief:
    "A financial intelligence unit flagged Nexus Trade Pvt. Ltd. for structuring transactions to avoid reporting thresholds. Subsequent investigation revealed a network of 4 shell companies receiving transfers from flagged accounts across Mauritius, UAE, and Singapore. The case involves 18 entities with a total of ₹14.7CR in suspicious transactions.",
  investigator: "AGENT KAPOOR",
  team: ["AGENT KAPOOR", "ANALYST MEHROTRA"],
  opened: "2026-08-01",
  updated: "5h ago",
  jurisdiction: "NATIONAL + INTERNATIONAL",
  classification: "RESTRICTED // LEVEL-2",
  entityCount: 18,
  relationshipCount: 41,
  evidenceCount: 12,
  alertCount: 2,
  aiAssessment: {
    finding:
      "Nexus Trade Pvt. Ltd. (E-1301) displays layering patterns consistent with the integration phase of money laundering — 87% confidence.",
    confidence: 87,
    category: "FINANCIAL PATTERN",
  },
  networks: [
    {
      id: "NET-003",
      name: "Offshore Finance Cluster",
      nodes: 18,
      edges: 41,
      riskLevel: "HIGH",
    },
  ],
  entities: [
    {
      id: "E-1301",
      name: "Nexus Trade Pvt. Ltd.",
      type: "ORGANIZATION",
      riskScore: 87,
      status: "FLAGGED",
      lastSeen: "2026-08-27",
    },
    {
      id: "E-1155",
      name: "ACC-007742881",
      type: "ACCOUNT",
      riskScore: 83,
      status: "FLAGGED",
      lastSeen: "2026-08-26",
    },
    {
      id: "E-1410",
      name: "Vikram Chadha",
      type: "PERSON",
      riskScore: 71,
      status: "MONITORING",
      lastSeen: "2026-08-24",
    },
  ],
  timeline: [
    {
      id: "T-001",
      timestamp: "2026-08-01 10:00",
      title: "Case Opened",
      description: "FIU referral received. Case opened by Agent Kapoor.",
      type: "SYSTEM",
    },
    {
      id: "T-002",
      timestamp: "2026-08-05 14:00",
      title: "Account Flagged",
      description:
        "ACC-007742881 flagged for ₹4.2CR transaction to offshore entity.",
      type: "FINANCIAL",
      relatedEntities: ["E-1155"],
    },
    {
      id: "T-003",
      timestamp: "2026-08-14 11:30",
      title: "Shell Company Identified",
      description:
        "Nexus Trade Pvt. Ltd. linked to 3 overseas shell companies via beneficial ownership analysis.",
      type: "INTEL",
      relatedEntities: ["E-1301"],
    },
  ],
  evidence: [
    {
      id: "EV-001",
      title: "FIU Referral Report",
      type: "DOCUMENT",
      source: "Financial Intelligence Unit",
      dateAdded: "2026-08-01",
      linkedEntities: ["E-1301"],
      description: "Initial referral citing suspicious transaction patterns.",
    },
    {
      id: "EV-002",
      title: "Bank Statement – ACC-007742881",
      type: "FINANCIAL_RECORD",
      source: "Financial Transaction Log – DS-002",
      dateAdded: "2026-08-06",
      linkedEntities: ["E-1155"],
      description: "6 months of statements showing structuring behavior.",
    },
  ],
  alerts: [
    {
      id: "ALT-0089",
      title: "Financial spike – offshore account",
      description:
        "ACC-007742881 logged ₹4.2CR transaction to unidentified offshore entity.",
      severity: "WARNING",
      status: "ACKNOWLEDGED",
      timestamp: "2026-08-29 12:05 UTC",
    },
    {
      id: "ALT-0086",
      title: "New shell company linked",
      description:
        "Fourth shell company identified in Singapore via beneficial ownership trace.",
      severity: "INFO",
      status: "RESOLVED",
      timestamp: "2026-08-25 09:00 UTC",
    },
  ],
  aiMessages: [
    {
      id: "M-001",
      role: "ai",
      content:
        "**Financial Pattern Analysis**\n\nThe transaction structure observed in CASE-0092 is consistent with the layering phase of money laundering. Nexus Trade Pvt. Ltd. is receiving multiple sub-threshold transfers (structuring) before routing consolidated amounts to offshore accounts.\n\nRisk score: **87/100 — HIGH**",
      timestamp: "2026-08-29 10:00",
    },
  ],
};

const CASE_0088: CaseDetail = {
  id: "CASE-0088",
  name: "Narco Supply Route – Punjab",
  status: "ACTIVE",
  priority: "HIGH",
  description:
    "Cross-border narcotics supply chain spanning Pakistan border. 76 entities identified in transit network.",
  brief:
    "A large-scale narcotics trafficking operation using a cross-border supply route from Pakistan through Punjab into Delhi and beyond. The network employs mule couriers, warehouses, and encrypted communications. 76 entities have been identified across 8 distinct network clusters. The operation is believed to generate ₹50CR+ annually.",
  investigator: "AGENT MEHTA",
  team: [
    "AGENT MEHTA",
    "AGENT SINGH",
    "AGENT VERMA",
    "ANALYST SHARMA",
    "ANALYST PATEL",
  ],
  opened: "2026-06-20",
  updated: "12h ago",
  jurisdiction: "NATIONAL — PB, HR, UP, DL",
  classification: "TOP SECRET // LEVEL-4",
  entityCount: 76,
  relationshipCount: 203,
  evidenceCount: 41,
  alertCount: 3,
  aiAssessment: {
    finding:
      "The Punjab transit corridor has 3 distinct supply chain tiers. Disrupting the mid-tier (5 identified entities) would isolate 34% of downstream nodes — highest leverage point.",
    confidence: 88,
    category: "SUPPLY CHAIN TOPOLOGY",
  },
  networks: [
    {
      id: "NET-004",
      name: "Punjab Transit Corridor",
      nodes: 76,
      edges: 203,
      riskLevel: "CRITICAL",
    },
    {
      id: "NET-005",
      name: "Courier Cell Alpha",
      nodes: 14,
      edges: 31,
      riskLevel: "HIGH",
    },
    {
      id: "NET-006",
      name: "Storage Network",
      nodes: 9,
      edges: 18,
      riskLevel: "HIGH",
    },
  ],
  entities: [
    {
      id: "E-1482",
      name: "Arjun Rawat",
      alias: "AJ",
      type: "PERSON",
      riskScore: 94,
      status: "FLAGGED",
      lastSeen: "2026-08-29",
    },
    {
      id: "E-0774",
      name: "Rajan Mehra",
      alias: "The Broker",
      type: "PERSON",
      riskScore: 91,
      status: "FLAGGED",
      lastSeen: "2026-08-28",
    },
    {
      id: "E-0822",
      name: "Patel Logistics",
      type: "ORGANIZATION",
      riskScore: 55,
      status: "MONITORING",
      lastSeen: "2026-08-20",
    },
    {
      id: "E-0610",
      name: "Amritsar Warehouse, Block 4",
      type: "LOCATION",
      riskScore: 78,
      status: "MONITORING",
      lastSeen: "2026-08-22",
    },
  ],
  timeline: [
    {
      id: "T-001",
      timestamp: "2026-06-20 08:00",
      title: "Case Opened",
      description:
        "Border intelligence flagged unusual vehicle movement at Wagah crossing. Case file created.",
      type: "SYSTEM",
    },
    {
      id: "T-002",
      timestamp: "2026-06-28 03:45",
      title: "First Interception",
      description:
        "Customs intercepted a vehicle linked to Patel Logistics carrying concealed narcotics.",
      type: "ARREST",
      relatedEntities: ["E-0822"],
    },
    {
      id: "T-003",
      timestamp: "2026-07-15 11:00",
      title: "Warehouse Identified",
      description:
        "Surveillance confirms Amritsar Warehouse Block 4 as transit storage point.",
      type: "SURVEILLANCE",
      relatedEntities: ["E-0610"],
    },
    {
      id: "T-004",
      timestamp: "2026-08-22 16:00",
      title: "Physical Evidence Seized",
      description:
        "Field team collected 4.2kg controlled substance from warehouse during raid.",
      type: "ARREST",
      relatedEntities: ["E-0610"],
    },
  ],
  evidence: [
    {
      id: "EV-001",
      title: "Customs Seizure Report – June 28",
      type: "PHYSICAL",
      source: "Customs & Immigration – DS-006",
      dateAdded: "2026-06-29",
      linkedEntities: ["E-0822"],
      description: "Official seizure report for intercepted vehicle.",
    },
    {
      id: "EV-002",
      title: "Warehouse Surveillance Footage",
      type: "MEDIA",
      source: "CCTV Index – DS-003",
      dateAdded: "2026-07-16",
      linkedEntities: ["E-0610", "E-1482"],
      description: "7 days of CCTV footage showing entity activity.",
    },
    {
      id: "EV-003",
      title: "Seized Narcotics Analysis",
      type: "PHYSICAL",
      source: "Forensics Lab",
      dateAdded: "2026-08-23",
      linkedEntities: ["E-0610"],
      description:
        "Lab analysis of 4.2kg seized substance — confirmed Class-A narcotic.",
    },
  ],
  alerts: [
    {
      id: "ALT-0087",
      title: "Cross-case entity match",
      description:
        "Entity E-1482 found to share attributes with E-0774. Automated cross-case linking triggered.",
      severity: "INFO",
      status: "ACKNOWLEDGED",
      timestamp: "2026-08-29 10:30 UTC",
    },
    {
      id: "ALT-0084",
      title: "New courier cell identified",
      description:
        "Intelligence suggests a new courier cell operating in Haryana, not previously mapped.",
      severity: "WARNING",
      status: "NEW",
      timestamp: "2026-08-28 15:00 UTC",
    },
    {
      id: "ALT-0080",
      title: "Entity risk score elevated",
      description:
        "Patel Logistics risk score raised after new evidence linkage.",
      severity: "INFO",
      status: "RESOLVED",
      timestamp: "2026-08-28 18:00 UTC",
    },
  ],
  aiMessages: [
    {
      id: "M-001",
      role: "ai",
      content:
        "**Supply Chain Analysis**\n\nThe Punjab narco network has a clear 3-tier structure: suppliers (border), distributors (mid-tier), and street-level cells. Mid-tier comprises 5 key entities. Disrupting this layer would isolate ~34% of downstream nodes and likely collapse Courier Cell Alpha.",
      timestamp: "2026-08-29 08:00",
    },
    {
      id: "M-002",
      role: "ai",
      content:
        "**Suggested Action**\n\nPriority target: Patel Logistics (E-0822) is a mid-tier logistics coordinator. A financial freeze combined with 24h physical surveillance is recommended before the next anticipated shipment window (next 48–72h based on pattern analysis).",
      timestamp: "2026-08-29 08:01",
    },
  ],
};

export const allCases: CaseDetail[] = [CASE_0091, CASE_0092, CASE_0088];

export function getCaseById(id: string): CaseDetail | undefined {
  return allCases.find((c) => c.id === id);
}

// Summary type for the case list page
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

export const caseSummaries: CaseSummary[] = [
  {
    id: "CASE-0091",
    name: "Operation Black Web",
    status: "ACTIVE",
    priority: "HIGH",
    entities: 43,
    networks: 5,
    investigator: "AGENT SHARMA",
    opened: "2026-07-14",
    updated: "2h ago",
    description:
      "Deep web marketplace network linked to narcotics and weapon distribution across 4 states.",
  },
  {
    id: "CASE-0092",
    name: "Financial Investigation – Offshore",
    status: "ACTIVE",
    priority: "MEDIUM",
    entities: 18,
    networks: 2,
    investigator: "AGENT KAPOOR",
    opened: "2026-08-01",
    updated: "5h ago",
    description:
      "Suspected money laundering via shell companies. Offshore accounts flagged in 3 jurisdictions.",
  },
  {
    id: "CASE-0088",
    name: "Narco Supply Route – Punjab",
    status: "ACTIVE",
    priority: "HIGH",
    entities: 76,
    networks: 8,
    investigator: "AGENT MEHTA",
    opened: "2026-06-20",
    updated: "12h ago",
    description:
      "Cross-border narcotics supply chain spanning Pakistan border. 76 entities identified in transit network.",
  },
  {
    id: "CASE-0083",
    name: "Cybercrime Syndicate – Mumbai",
    status: "PENDING",
    priority: "MEDIUM",
    entities: 29,
    networks: 3,
    investigator: "AGENT VERMA",
    opened: "2026-05-10",
    updated: "2 days ago",
    description:
      "Organized cybercrime group suspected of large-scale phishing and bank fraud operations.",
  },
  {
    id: "CASE-0071",
    name: "Human Trafficking – Network Alpha",
    status: "CLOSED",
    priority: "HIGH",
    entities: 94,
    networks: 11,
    investigator: "AGENT SINGH",
    opened: "2026-02-03",
    updated: "30 days ago",
    description:
      "Dismantled trafficking network. 94 entities prosecuted. Case closed with 12 convictions.",
  },
  {
    id: "CASE-0065",
    name: "Counterfeit Currency Ring",
    status: "CLOSED",
    priority: "LOW",
    entities: 12,
    networks: 1,
    investigator: "AGENT PATEL",
    opened: "2026-01-18",
    updated: "45 days ago",
    description:
      "Small-scale counterfeit operation. Case resolved, suspects in custody.",
  },
];
