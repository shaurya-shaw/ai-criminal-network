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
} from "./types";

// ─── Initial Seed Data ────────────────────────────────────────────────────────

const initialCases: CaseDetail[] = [
  {
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
      { id: "NET-001", name: "Black Web Core Ring", nodes: 43, edges: 118, riskLevel: "CRITICAL" },
      { id: "NET-002", name: "Courier Sub-Network", nodes: 12, edges: 29, riskLevel: "HIGH" },
    ],
    entities: [
      { id: "E-1482", name: "Arjun Rawat", alias: "AJ", type: "PERSON", riskScore: 94, status: "FLAGGED", lastSeen: "2026-08-29" },
      { id: "E-0774", name: "Rajan Mehra", alias: "The Broker", type: "PERSON", riskScore: 91, status: "FLAGGED", lastSeen: "2026-08-28" },
      { id: "E-0941", name: "+91-98765-43210", type: "PHONE", riskScore: 62, status: "MONITORING", lastSeen: "2026-08-25" },
      { id: "E-1188", name: "Shadow Vault Ltd.", type: "ORGANIZATION", riskScore: 85, status: "FLAGGED", lastSeen: "2026-08-27" },
      { id: "E-1340", name: "BTC Wallet 0x4f8...c3a", type: "ACCOUNT", riskScore: 77, status: "MONITORING", lastSeen: "2026-08-26" },
      { id: "E-0610", name: "Amritsar Warehouse, Block 4", type: "LOCATION", riskScore: 78, status: "MONITORING", lastSeen: "2026-08-22" },
    ],
    timeline: [
      {
        id: "T-001",
        timestamp: "2026-07-14 09:00",
        title: "Case Opened",
        description: "Initial intelligence received from CDRS analysis. Case file created and assigned to Agent Sharma.",
        type: "SYSTEM",
      },
      {
        id: "T-002",
        timestamp: "2026-07-18 14:32",
        title: "First Surveillance Contact",
        description: "Physical surveillance team established visual on Arjun Rawat (E-1482) at Amritsar Warehouse, Block 4.",
        type: "SURVEILLANCE",
        relatedEntities: ["E-1482", "E-0610"],
      },
      {
        id: "T-003",
        timestamp: "2026-07-24 11:15",
        title: "Cryptocurrency Trace Initiated",
        description: "Blockchain analysis unit flagged BTC Wallet 0x4f8...c3a with ₹2.1CR in unattributed inflows over 30 days.",
        type: "FINANCIAL",
        relatedEntities: ["E-1340"],
      },
      {
        id: "T-004",
        timestamp: "2026-08-02 08:44",
        title: "Communication Intercept",
        description: "Encrypted communication between E-1482 and E-0774 intercepted. Content partially decoded — references to 'shipment D4'.",
        type: "COMMUNICATION",
        relatedEntities: ["E-1482", "E-0774"],
      },
      {
        id: "T-005",
        timestamp: "2026-08-10 19:20",
        title: "Shadow Vault Ltd. Flagged",
        description: "Financial intelligence links Shadow Vault Ltd. to three shell companies receiving transfers from flagged accounts.",
        type: "FINANCIAL",
        relatedEntities: ["E-1188"],
      },
      {
        id: "T-006",
        timestamp: "2026-08-17 03:15",
        title: "Intel: Supplier Identity",
        description: "Source DELTA-7 confirms Rajan Mehra (E-0774) is acting as primary coordinator between dark web marketplace and physical distribution network.",
        type: "INTEL",
        relatedEntities: ["E-0774"],
      },
      {
        id: "T-007",
        timestamp: "2026-08-22 16:00",
        title: "Network Anomaly Detected",
        description: "Automated system flagged unusual spike in connections from E-1482. Three new previously unknown nodes identified.",
        type: "SYSTEM",
        relatedEntities: ["E-1482"],
      },
      {
        id: "T-008",
        timestamp: "2026-08-29 13:48",
        title: "High Priority Alert Triggered",
        description: "Network topology engine detected new cross-border connection. Alert escalated to lead investigator.",
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
        description: "28 days of call detail records showing communication pattern between key entities.",
      },
      {
        id: "EV-002",
        title: "BTC Transaction History",
        type: "FINANCIAL_RECORD",
        source: "Blockchain Analysis Unit",
        dateAdded: "2026-07-25",
        linkedEntities: ["E-1340", "E-1188"],
        description: "Cryptocurrency transaction ledger with ₹2.1CR unattributed inflows flagged.",
      },
      {
        id: "EV-003",
        title: "Surveillance Footage – Amritsar Warehouse",
        type: "MEDIA",
        source: "CCTV Index – DS-003",
        dateAdded: "2026-07-19",
        linkedEntities: ["E-1482", "E-0610"],
        description: "72 hours of footage capturing entity movement at Warehouse Block 4.",
      },
      {
        id: "EV-004",
        title: "Encrypted Message Partial Decode",
        type: "DOCUMENT",
        source: "SIGINT Unit",
        dateAdded: "2026-08-03",
        linkedEntities: ["E-1482", "E-0774"],
        description: "Partially decoded encrypted communication referencing 'shipment D4' and delivery coordinates.",
      },
      {
        id: "EV-005",
        title: "Shadow Vault Ltd. Incorporation Docs",
        type: "DOCUMENT",
        source: "MCA Registry",
        dateAdded: "2026-08-11",
        linkedEntities: ["E-1188"],
        description: "Company incorporation documents listing E-0774 as a silent director via nominee arrangement.",
      },
      {
        id: "EV-006",
        title: "Seized Physical Sample – Batch D4",
        type: "PHYSICAL",
        source: "Field Team ALPHA",
        dateAdded: "2026-08-20",
        linkedEntities: ["E-0610"],
        description: "Physical evidence collected from Amritsar Warehouse – 4.2kg controlled substance, forensic analysis pending.",
      },
    ],
    alerts: [
      {
        id: "ALT-0091",
        title: "Network anomaly detected",
        description: "Unusual spike in connection requests from entity E-1482 across 3 nodes in cluster B. Possible lateral movement.",
        severity: "CRITICAL",
        status: "NEW",
        timestamp: "2026-08-29 13:48 UTC",
      },
      {
        id: "ALT-0090",
        title: "High-risk entity flagged",
        description: "Entity E-0774 matched against cross-case correlation engine. Appears in 3 active cases.",
        severity: "CRITICAL",
        status: "NEW",
        timestamp: "2026-08-29 13:21 UTC",
      },
      {
        id: "ALT-0088",
        title: "New connection established",
        description: "Previously unknown entity added connection to Rajan Mehra (E-0774). Entity ID pending assignment.",
        severity: "WARNING",
        status: "ACKNOWLEDGED",
        timestamp: "2026-08-29 11:44 UTC",
      },
      {
        id: "ALT-0085",
        title: "Crypto wallet activity",
        description: "BTC Wallet 0x4f8...c3a recorded outbound transaction of ₹0.8CR to unknown address.",
        severity: "WARNING",
        status: "ACKNOWLEDGED",
        timestamp: "2026-08-28 22:30 UTC",
      },
      {
        id: "ALT-0081",
        title: "CDRS sync gap resolved",
        description: "18-minute data gap in CDRS feed now recovered. No records missing.",
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
  },
  {
    id: "CASE-0092",
    name: "Financial Investigation – Offshore",
    status: "ACTIVE",
    priority: "MEDIUM",
    description: "Suspected money laundering via shell companies. Offshore accounts flagged in 3 jurisdictions.",
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
      finding: "Nexus Trade Pvt. Ltd. (E-1301) displays layering patterns consistent with the integration phase of money laundering — 87% confidence.",
      confidence: 87,
      category: "FINANCIAL PATTERN",
    },
    networks: [
      { id: "NET-003", name: "Offshore Finance Cluster", nodes: 18, edges: 41, riskLevel: "HIGH" },
    ],
    entities: [
      { id: "E-1301", name: "Nexus Trade Pvt. Ltd.", type: "ORGANIZATION", riskScore: 87, status: "FLAGGED", lastSeen: "2026-08-27" },
      { id: "E-1155", name: "ACC-007742881", type: "ACCOUNT", riskScore: 83, status: "FLAGGED", lastSeen: "2026-08-26" },
      { id: "E-1410", name: "Vikram Chadha", type: "PERSON", riskScore: 71, status: "MONITORING", lastSeen: "2026-08-24" },
    ],
    timeline: [
      { id: "T-001", timestamp: "2026-08-01 10:00", title: "Case Opened", description: "FIU referral received. Case opened by Agent Kapoor.", type: "SYSTEM" },
      { id: "T-002", timestamp: "2026-08-05 14:00", title: "Account Flagged", description: "ACC-007742881 flagged for ₹4.2CR transaction to offshore entity.", type: "FINANCIAL", relatedEntities: ["E-1155"] },
      { id: "T-003", timestamp: "2026-08-14 11:30", title: "Shell Company Identified", description: "Nexus Trade Pvt. Ltd. linked to 3 overseas shell companies via beneficial ownership analysis.", type: "INTEL", relatedEntities: ["E-1301"] },
    ],
    evidence: [
      { id: "EV-001", title: "FIU Referral Report", type: "DOCUMENT", source: "Financial Intelligence Unit", dateAdded: "2026-08-01", linkedEntities: ["E-1301"], description: "Initial referral citing suspicious transaction patterns." },
      { id: "EV-002", title: "Bank Statement – ACC-007742881", type: "FINANCIAL_RECORD", source: "Financial Transaction Log – DS-002", dateAdded: "2026-08-06", linkedEntities: ["E-1155"], description: "6 months of statements showing structuring behavior." },
    ],
    alerts: [
      { id: "ALT-0089", title: "Financial spike – offshore account", description: "ACC-007742881 logged ₹4.2CR transaction to unidentified offshore entity.", severity: "WARNING", status: "ACKNOWLEDGED", timestamp: "2026-08-29 12:05 UTC" },
      { id: "ALT-0086", title: "New shell company linked", description: "Fourth shell company identified in Singapore via beneficial ownership trace.", severity: "INFO", status: "RESOLVED", timestamp: "2026-08-25 09:00 UTC" },
    ],
    aiMessages: [
      { id: "M-001", role: "ai", content: "**Financial Pattern Analysis**\n\nThe transaction structure observed in CASE-0092 is consistent with the layering phase of money laundering. Nexus Trade Pvt. Ltd. is receiving multiple sub-threshold transfers (structuring) before routing consolidated amounts to offshore accounts.\n\nRisk score: **87/100 — HIGH**", timestamp: "2026-08-29 10:00" },
    ],
  },
  {
    id: "CASE-0088",
    name: "Narco Supply Route – Punjab",
    status: "ACTIVE",
    priority: "HIGH",
    description: "Cross-border narcotics supply chain spanning Pakistan border. 76 entities identified in transit network.",
    brief:
      "A large-scale narcotics trafficking operation using a cross-border supply route from Pakistan through Punjab into Delhi and beyond. The network employs mule couriers, warehouses, and encrypted communications. 76 entities have been identified across 8 distinct network clusters. The operation is believed to generate ₹50CR+ annually.",
    investigator: "AGENT MEHTA",
    team: ["AGENT MEHTA", "AGENT SINGH", "AGENT VERMA", "ANALYST SHARMA", "ANALYST PATEL"],
    opened: "2026-06-20",
    updated: "12h ago",
    jurisdiction: "NATIONAL — PB, HR, UP, DL",
    classification: "TOP SECRET // LEVEL-4",
    entityCount: 76,
    relationshipCount: 203,
    evidenceCount: 41,
    alertCount: 3,
    aiAssessment: {
      finding: "The Punjab transit corridor has 3 distinct supply chain tiers. Disrupting the mid-tier (5 identified entities) would isolate 34% of downstream nodes — highest leverage point.",
      confidence: 88,
      category: "SUPPLY CHAIN TOPOLOGY",
    },
    networks: [
      { id: "NET-004", name: "Punjab Transit Corridor", nodes: 76, edges: 203, riskLevel: "CRITICAL" },
      { id: "NET-005", name: "Courier Cell Alpha", nodes: 14, edges: 31, riskLevel: "HIGH" },
      { id: "NET-006", name: "Storage Network", nodes: 9, edges: 18, riskLevel: "HIGH" },
    ],
    entities: [
      { id: "E-1482", name: "Arjun Rawat", alias: "AJ", type: "PERSON", riskScore: 94, status: "FLAGGED", lastSeen: "2026-08-29" },
      { id: "E-0774", name: "Rajan Mehra", alias: "The Broker", type: "PERSON", riskScore: 91, status: "FLAGGED", lastSeen: "2026-08-28" },
      { id: "E-0822", name: "Patel Logistics", type: "ORGANIZATION", riskScore: 55, status: "MONITORING", lastSeen: "2026-08-20" },
      { id: "E-0610", name: "Amritsar Warehouse, Block 4", type: "LOCATION", riskScore: 78, status: "MONITORING", lastSeen: "2026-08-22" },
    ],
    timeline: [
      { id: "T-001", timestamp: "2026-06-20 08:00", title: "Case Opened", description: "Border intelligence flagged unusual vehicle movement at Wagah crossing. Case file created.", type: "SYSTEM" },
      { id: "T-002", timestamp: "2026-06-28 03:45", title: "First Interception", description: "Customs intercepted a vehicle linked to Patel Logistics carrying concealed narcotics.", type: "ARREST", relatedEntities: ["E-0822"] },
      { id: "T-003", timestamp: "2026-07-15 11:00", title: "Warehouse Identified", description: "Surveillance confirms Amritsar Warehouse Block 4 as transit storage point.", type: "SURVEILLANCE", relatedEntities: ["E-0610"] },
      { id: "T-004", timestamp: "2026-08-22 16:00", title: "Physical Evidence Seized", description: "Field team collected 4.2kg controlled substance from warehouse during raid.", type: "ARREST", relatedEntities: ["E-0610"] },
    ],
    evidence: [
      { id: "EV-001", title: "Customs Seizure Report – June 28", type: "PHYSICAL", source: "Customs & Immigration – DS-006", dateAdded: "2026-06-29", linkedEntities: ["E-0822"], description: "Official seizure report for intercepted vehicle." },
      { id: "EV-002", title: "Warehouse Surveillance Footage", type: "MEDIA", source: "CCTV Index – DS-003", dateAdded: "2026-07-16", linkedEntities: ["E-0610", "E-1482"], description: "7 days of CCTV footage showing entity activity." },
      { id: "EV-003", title: "Seized Narcotics Analysis", type: "PHYSICAL", source: "Forensics Lab", dateAdded: "2026-08-23", linkedEntities: ["E-0610"], description: "Lab analysis of 4.2kg seized substance — confirmed Class-A narcotic." },
    ],
    alerts: [
      { id: "ALT-0087", title: "Cross-case entity match", description: "Entity E-1482 found to share attributes with E-0774. Automated cross-case linking triggered.", severity: "INFO", status: "ACKNOWLEDGED", timestamp: "2026-08-29 10:30 UTC" },
      { id: "ALT-0084", title: "New courier cell identified", description: "Intelligence suggests a new courier cell operating in Haryana, not previously mapped.", severity: "WARNING", status: "NEW", timestamp: "2026-08-28 15:00 UTC" },
      { id: "ALT-0080", title: "Entity risk score elevated", description: "Patel Logistics risk score raised after new evidence linkage.", severity: "INFO", status: "RESOLVED", timestamp: "2026-08-28 18:00 UTC" },
    ],
    aiMessages: [
      { id: "M-001", role: "ai", content: "**Supply Chain Analysis**\n\nThe Punjab narco network has a clear 3-tier structure: suppliers (border), distributors (mid-tier), and street-level cells. Mid-tier comprises 5 key entities. Disrupting this layer would isolate ~34% of downstream nodes and likely collapse Courier Cell Alpha.", timestamp: "2026-08-29 08:00" },
      { id: "M-002", role: "ai", content: "**Suggested Action**\n\nPriority target: Patel Logistics (E-0822) is a mid-tier logistics coordinator. A financial freeze combined with 24h physical surveillance is recommended before the next anticipated shipment window (next 48–72h based on pattern analysis).", timestamp: "2026-08-29 08:01" },
    ],
  },
  {
    id: "CASE-0083",
    name: "Cybercrime Syndicate – Mumbai",
    status: "PENDING",
    priority: "MEDIUM",
    description: "Organized cybercrime group suspected of large-scale phishing and bank fraud operations.",
    brief: "Coordinated cyber financial crimes network operating phishing hubs and SIM swap networks targeting corporate bank accounts across Maharashtra and Gujarat.",
    investigator: "AGENT VERMA",
    team: ["AGENT VERMA", "AGENT MEHRA"],
    opened: "2026-05-10",
    updated: "2 days ago",
    jurisdiction: "STATE — MH, GJ",
    classification: "CONFIDENTIAL // LEVEL-2",
    entityCount: 29,
    relationshipCount: 67,
    evidenceCount: 15,
    alertCount: 1,
    aiAssessment: {
      finding: "Call routing infrastructure shows distributed proxy servers across 2 IP blocks.",
      confidence: 81,
      category: "CYBER INFRASTRUCTURE",
    },
    networks: [{ id: "NET-004", name: "Mumbai Cyber Syndicate", nodes: 29, edges: 67, riskLevel: "MEDIUM" }],
    entities: [
      { id: "E-0390", name: "Sameer Khan", alias: "SKhan", type: "PERSON", riskScore: 34, status: "CLEARED", lastSeen: "2026-08-10" },
      { id: "E-0774", name: "Rajan Mehra", alias: "The Broker", type: "PERSON", riskScore: 91, status: "FLAGGED", lastSeen: "2026-08-28" },
    ],
    timeline: [],
    evidence: [],
    alerts: [],
    aiMessages: [],
  },
  {
    id: "CASE-0071",
    name: "Human Trafficking – Network Alpha",
    status: "CLOSED",
    priority: "HIGH",
    description: "Dismantled trafficking network. 94 entities prosecuted. Case closed with 12 convictions.",
    brief: "Inter-state human trafficking syndicate dismantled following multi-state raid operations.",
    investigator: "AGENT SINGH",
    team: ["AGENT SINGH"],
    opened: "2026-02-03",
    updated: "30 days ago",
    jurisdiction: "NATIONAL",
    classification: "RESTRICTED",
    entityCount: 94,
    relationshipCount: 180,
    evidenceCount: 52,
    alertCount: 0,
    aiAssessment: {
      finding: "Case completed. Primary hub neutralized.",
      confidence: 99,
      category: "DISMANTLED",
    },
    networks: [],
    entities: [],
    timeline: [],
    evidence: [],
    alerts: [],
    aiMessages: [],
  },
  {
    id: "CASE-0065",
    name: "Counterfeit Currency Ring",
    status: "CLOSED",
    priority: "LOW",
    description: "Small-scale counterfeit operation. Case resolved, suspects in custody.",
    brief: "Local fake currency distribution network printing ₹500 denomination notes.",
    investigator: "AGENT PATEL",
    team: ["AGENT PATEL"],
    opened: "2026-01-18",
    updated: "45 days ago",
    jurisdiction: "REGIONAL",
    classification: "RESTRICTED",
    entityCount: 12,
    relationshipCount: 22,
    evidenceCount: 8,
    alertCount: 0,
    aiAssessment: {
      finding: "All suspects in custody.",
      confidence: 100,
      category: "RESOLVED",
    },
    networks: [],
    entities: [],
    timeline: [],
    evidence: [],
    alerts: [],
    aiMessages: [],
  },
];

const initialNetworks: NetworkEntry[] = [
  {
    id: "NET-001",
    name: "Black Web Supply Ring",
    nodes: 43,
    edges: 118,
    risk: "CRITICAL",
    crossBorder: true,
    regions: ["MH", "DL", "PB", "RJ"],
    caseId: "CASE-0091",
    lastActivity: "14 min ago",
    graphTopology: {
      nodes: [
        { id: "E-1482", label: "Arjun Rawat", type: "PERSON", riskScore: 94 },
        { id: "E-0774", label: "Rajan Mehra", type: "PERSON", riskScore: 91 },
        { id: "E-0941", label: "+91-98765-43210", type: "PHONE", riskScore: 62 },
        { id: "E-1188", label: "Shadow Vault Ltd.", type: "ORGANIZATION", riskScore: 85 },
        { id: "E-1340", label: "BTC Wallet 0x4f8", type: "ACCOUNT", riskScore: 77 },
        { id: "E-0610", label: "Amritsar Warehouse", type: "LOCATION", riskScore: 78 },
      ],
      edges: [
        { source: "E-1482", target: "E-0774", relationship: "COORDINATES_WITH", confidence: 0.95 },
        { source: "E-1482", target: "E-0941", relationship: "COMMUNICATES_VIA", confidence: 0.98 },
        { source: "E-0774", target: "E-1188", relationship: "BENEFICIAL_OWNER", confidence: 0.88 },
        { source: "E-1188", target: "E-1340", relationship: "CONTROLS_WALLET", confidence: 0.91 },
        { source: "E-1482", target: "E-0610", relationship: "OPERATES_OUT_OF", confidence: 0.85 },
      ],
    },
  },
  {
    id: "NET-002",
    name: "Offshore Finance Cluster",
    nodes: 18,
    edges: 41,
    risk: "HIGH",
    crossBorder: true,
    regions: ["MH", "GJ"],
    caseId: "CASE-0092",
    lastActivity: "2h ago",
    graphTopology: {
      nodes: [
        { id: "E-1301", label: "Nexus Trade Pvt. Ltd.", type: "ORGANIZATION", riskScore: 87 },
        { id: "E-1155", label: "ACC-007742881", type: "ACCOUNT", riskScore: 83 },
        { id: "E-1410", label: "Vikram Chadha", type: "PERSON", riskScore: 71 },
      ],
      edges: [
        { source: "E-1410", target: "E-1301", relationship: "DIRECTOR_OF", confidence: 0.92 },
        { source: "E-1301", target: "E-1155", relationship: "HOLDS_ACCOUNT", confidence: 0.99 },
      ],
    },
  },
  {
    id: "NET-003",
    name: "Punjab Transit Corridor",
    nodes: 76,
    edges: 203,
    risk: "CRITICAL",
    crossBorder: true,
    regions: ["PB", "HR", "UP"],
    caseId: "CASE-0088",
    lastActivity: "12h ago",
    graphTopology: {
      nodes: [
        { id: "E-1482", label: "Arjun Rawat", type: "PERSON", riskScore: 94 },
        { id: "E-0774", label: "Rajan Mehra", type: "PERSON", riskScore: 91 },
        { id: "E-0822", label: "Patel Logistics", type: "ORGANIZATION", riskScore: 55 },
        { id: "E-0610", label: "Amritsar Warehouse", type: "LOCATION", riskScore: 78 },
      ],
      edges: [
        { source: "E-0774", target: "E-0822", relationship: "CONTRACTS", confidence: 0.89 },
        { source: "E-0822", target: "E-0610", relationship: "SHIPS_TO", confidence: 0.94 },
        { source: "E-1482", target: "E-0610", relationship: "RECEIVES_AT", confidence: 0.88 },
      ],
    },
  },
  {
    id: "NET-004",
    name: "Mumbai Cyber Syndicate",
    nodes: 29,
    edges: 67,
    risk: "MEDIUM",
    crossBorder: false,
    regions: ["MH"],
    caseId: "CASE-0083",
    lastActivity: "2 days ago",
    graphTopology: {
      nodes: [
        { id: "E-0390", label: "Sameer Khan", type: "PERSON", riskScore: 34 },
        { id: "E-0774", label: "Rajan Mehra", type: "PERSON", riskScore: 91 },
      ],
      edges: [
        { source: "E-0390", target: "E-0774", relationship: "REPORTED_TO", confidence: 0.76 },
      ],
    },
  },
];

const initialEntities: Entity[] = [
  {
    id: "E-1482",
    name: "Arjun Rawat",
    alias: "AJ",
    type: "PERSON",
    riskScore: 94,
    cases: ["CASE-0091", "CASE-0088"],
    lastSeen: "2026-08-29",
    status: "FLAGGED",
  },
  {
    id: "E-1301",
    name: "Nexus Trade Pvt. Ltd.",
    type: "ORGANIZATION",
    riskScore: 87,
    cases: ["CASE-0092"],
    lastSeen: "2026-08-27",
    status: "FLAGGED",
  },
  {
    id: "E-0774",
    name: "Rajan Mehra",
    alias: "The Broker",
    type: "PERSON",
    riskScore: 91,
    cases: ["CASE-0091", "CASE-0088", "CASE-0083"],
    lastSeen: "2026-08-28",
    status: "FLAGGED",
  },
  {
    id: "E-0941",
    name: "+91-98765-43210",
    type: "PHONE",
    riskScore: 62,
    cases: ["CASE-0091"],
    lastSeen: "2026-08-25",
    status: "MONITORING",
  },
  {
    id: "E-0822",
    name: "Patel Logistics",
    type: "ORGANIZATION",
    riskScore: 55,
    cases: ["CASE-0088"],
    lastSeen: "2026-08-20",
    status: "MONITORING",
  },
  {
    id: "E-0610",
    name: "Amritsar Warehouse, Block 4",
    type: "LOCATION",
    riskScore: 78,
    cases: ["CASE-0088", "CASE-0091"],
    lastSeen: "2026-08-22",
    status: "MONITORING",
  },
  {
    id: "E-1155",
    name: "ACC-007742881",
    type: "ACCOUNT",
    riskScore: 83,
    cases: ["CASE-0092"],
    lastSeen: "2026-08-26",
    status: "FLAGGED",
  },
  {
    id: "E-1188",
    name: "Shadow Vault Ltd.",
    type: "ORGANIZATION",
    riskScore: 85,
    cases: ["CASE-0091"],
    lastSeen: "2026-08-27",
    status: "FLAGGED",
  },
  {
    id: "E-1340",
    name: "BTC Wallet 0x4f8...c3a",
    type: "ACCOUNT",
    riskScore: 77,
    cases: ["CASE-0091"],
    lastSeen: "2026-08-26",
    status: "MONITORING",
  },
  {
    id: "E-0390",
    name: "Sameer Khan",
    alias: "SKhan",
    type: "PERSON",
    riskScore: 34,
    cases: ["CASE-0083"],
    lastSeen: "2026-08-10",
    status: "CLEARED",
  },
];

const initialAlerts: GlobalAlert[] = [
  {
    id: "ALT-0091",
    title: "Network anomaly detected",
    description:
      "Unusual spike in connection requests from entity E-1482 across 3 nodes in cluster B. Possible lateral movement detected.",
    severity: "CRITICAL",
    status: "NEW",
    caseId: "CASE-0091",
    timestamp: "2026-08-29 13:48 UTC",
  },
  {
    id: "ALT-0090",
    title: "High-risk entity flagged for review",
    description:
      "Entity E-0774 matched against cross-case correlation engine. Appears in 3 active cases. Manual review required.",
    severity: "CRITICAL",
    status: "NEW",
    caseId: "CASE-0088",
    timestamp: "2026-08-29 13:21 UTC",
  },
  {
    id: "ALT-0089",
    title: "Financial spike — offshore account",
    description:
      "Account ACC-007742881 logged a ₹4.2CR transaction to an unidentified offshore entity. Flagged for AML review.",
    severity: "WARNING",
    status: "ACKNOWLEDGED",
    caseId: "CASE-0092",
    timestamp: "2026-08-29 12:05 UTC",
  },
  {
    id: "ALT-0088",
    title: "New connection established",
    description:
      "Previously unknown entity added a connection to Rajan Mehra (E-0774). Entity ID pending assignment.",
    severity: "WARNING",
    status: "NEW",
    caseId: "CASE-0091",
    timestamp: "2026-08-29 11:44 UTC",
  },
  {
    id: "ALT-0087",
    title: "Cross-case entity match",
    description:
      "Entity E-1482 found to share attributes with E-0774. Automated cross-case linking triggered.",
    severity: "INFO",
    status: "ACKNOWLEDGED",
    caseId: "CASE-0088",
    timestamp: "2026-08-29 10:30 UTC",
  },
  {
    id: "ALT-0085",
    title: "Data source sync failure",
    description:
      "CDRS feed failed to synchronize for 18 minutes. Partial data gap logged. Auto-recovery initiated.",
    severity: "WARNING",
    status: "RESOLVED",
    caseId: "CASE-0083",
    timestamp: "2026-08-28 22:14 UTC",
  },
  {
    id: "ALT-0082",
    title: "Entity risk score elevated",
    description:
      "Patel Logistics (E-0822) risk score raised from 42 to 55 after new evidence linkage.",
    severity: "INFO",
    status: "RESOLVED",
    caseId: "CASE-0088",
    timestamp: "2026-08-28 18:00 UTC",
  },
];

const initialDataSources: DataSource[] = [
  { id: "DS-001", name: "CDRS Feed", type: "Telecommunications", status: "SYNCED", latency: "38ms", records: "2.4M", lastSync: "2 min ago" },
  { id: "DS-002", name: "Financial Transaction Log", type: "Banking", status: "SYNCED", latency: "55ms", records: "840K", lastSync: "5 min ago" },
  { id: "DS-003", name: "Surveillance CCTV Index", type: "Physical Surveillance", status: "SYNCED", latency: "112ms", records: "91K", lastSync: "12 min ago" },
  { id: "DS-004", name: "FIR Database", type: "Law Enforcement", status: "SYNCED", latency: "29ms", records: "184K", lastSync: "1 min ago" },
  { id: "DS-005", name: "Social Media Harvest", type: "OSINT", status: "PARTIAL", latency: "—", records: "3.1M", lastSync: "18 min ago" },
  { id: "DS-006", name: "Customs & Immigration", type: "Border Control", status: "SYNCED", latency: "76ms", records: "520K", lastSync: "8 min ago" },
];

const initialSettings: { preferences: SystemPreferences; operator: OperatorProfile } = {
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

const initialActivityLogs: ActivityLog[] = [
  { id: "LOG-01", time: "14:02", label: "CASE-0091 // 3 new edges detected in cluster B", severityColor: "emerald" },
  { id: "LOG-02", time: "13:47", label: "CASE-0092 // Financial node linked to offshore account", severityColor: "amber" },
  { id: "LOG-03", time: "13:21", label: "CASE-0088 // Supply route node updated – 2 new contacts", severityColor: "amber" },
  { id: "LOG-04", time: "12:58", label: "SYSTEM // Cross-case entity match: E-1482 ↔ E-0774", severityColor: "cyan" },
  { id: "LOG-05", time: "12:33", label: "CASE-0091 // High-risk entity flagged for manual review", severityColor: "red" },
];

// ─── In-Memory Store Class ───────────────────────────────────────────────────

class ForensicDataStore {
  private cases: CaseDetail[] = [...initialCases];
  private networks: NetworkEntry[] = [...initialNetworks];
  private entities: Entity[] = [...initialEntities];
  private alerts: GlobalAlert[] = [...initialAlerts];
  private dataSources: DataSource[] = [...initialDataSources];
  private settings = { ...initialSettings };
  private activityLogs: ActivityLog[] = [...initialActivityLogs];

  // ── Overview ─────────────────────────────────────────────────────────────
  getOverviewTelemetry(): OverviewTelemetry {
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
        activeCases: { value: activeCasesCount, delta: "+2 this week" },
        totalEntities: { value: totalEntitiesCount, delta: `+${totalEntitiesCount} indexed` },
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
    return this.cases.find((c) => c.id.toLowerCase() === id.toLowerCase());
  }

  createCase(data: {
    name: string;
    description: string;
    priority: Priority;
    investigator: string;
    jurisdiction: string;
    classification?: string;
    brief?: string;
  }): CaseDetail {
    const newId = `CASE-00${String(this.cases.length + 90)}`;
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
    this.cases.unshift(newCase);
    return newCase;
  }

  updateCase(id: string, updates: Partial<CaseDetail>): CaseDetail | undefined {
    const caseIndex = this.cases.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
    if (caseIndex === -1) return undefined;
    this.cases[caseIndex] = {
      ...this.cases[caseIndex],
      ...updates,
      updated: "Just now",
    };
    return this.cases[caseIndex];
  }

  appendAIMessage(caseId: string, userMessage: string): AIMessage | undefined {
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
    return aiMsg;
  }

  // ── Networks ─────────────────────────────────────────────────────────────
  getAllNetworks(risk?: NetworkRiskLevel | "ALL", search?: string): NetworkEntry[] {
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
    return newEntity;
  }

  updateEntity(id: string, updates: Partial<Entity>): Entity | undefined {
    const index = this.entities.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return undefined;
    this.entities[index] = { ...this.entities[index], ...updates };
    return this.entities[index];
  }

  // ── Alerts ───────────────────────────────────────────────────────────────
  getAllAlerts(params?: {
    severity?: AlertSeverity | "ALL";
    status?: AlertStatus | "ALL";
    caseId?: string;
  }): GlobalAlert[] {
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
    return newAlert;
  }

  updateAlertStatus(id: string, status: AlertStatus): GlobalAlert | undefined {
    const alertItem = this.alerts.find((a) => a.id.toLowerCase() === id.toLowerCase());
    if (!alertItem) return undefined;
    alertItem.status = status;
    return alertItem;
  }

  // ── Data Sources ─────────────────────────────────────────────────────────
  getAllDataSources(): DataSource[] {
    return this.dataSources;
  }

  syncDataSources(sourceId?: string): { success: boolean; syncedAt: string; updatedSources: DataSource[] } {
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
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      updatedSources: this.dataSources,
    };
  }

  // ── Settings ─────────────────────────────────────────────────────────────
  getSettings() {
    return this.settings;
  }

  updatePreferences(preferences: Partial<SystemPreferences>) {
    this.settings.preferences = {
      ...this.settings.preferences,
      ...preferences,
    };
    return this.settings;
  }
}

// Global Singleton Store
export const dataStore = new ForensicDataStore();
