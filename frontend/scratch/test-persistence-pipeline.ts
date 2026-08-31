import { dataStore } from "../lib/api/data-store";
import type { IntelligenceExtractionResult } from "../lib/ai/types";

async function main() {
  console.log("=== 1. Testing Local Persistent DataStore ===");
  
  const mockFIR: IntelligenceExtractionResult = {
    caseTitle: "Operation Phoenix // Counterfeit Currency Ring",
    brief: "Inter-state counterfeit note syndicate operating across NCR and West Bengal borders.",
    jurisdiction: "STATE & NATIONAL — DL, WB",
    classification: "RESTRICTED // LEVEL-3",
    summary: "Seizure of ₹45L counterfeit currency during border interdiction checkpoint.",
    confidenceScore: 95,
    entities: [
      {
        id: "ENT-101",
        name: "Vikram Malhotra",
        aliases: ["Vicky", "The Printer"],
        type: "Person",
        riskScore: 94,
        confidence: 98,
      },
      {
        id: "ENT-102",
        name: "Apex Print Solutions Pvt Ltd",
        aliases: [],
        type: "Organization",
        riskScore: 88,
        confidence: 95,
      },
      {
        id: "ENT-103",
        name: "+91 99887 76655",
        aliases: [],
        type: "Phone",
        riskScore: 78,
        confidence: 92,
      },
      {
        id: "ENT-104",
        name: "DL-01-CR-4402",
        aliases: [],
        type: "Vehicle",
        riskScore: 82,
        confidence: 90,
      },
    ],
    relationships: [
      {
        source: "ENT-101",
        target: "ENT-102",
        type: "WORKS_FOR",
        confidence: 96,
        description: "Controls the printing facility",
      },
      {
        source: "ENT-101",
        target: "ENT-103",
        type: "CALLED",
        confidence: 94,
        description: "Communicates using burner phone",
      },
      {
        source: "ENT-101",
        target: "ENT-104",
        type: "OWNS",
        confidence: 91,
        description: "Used to transport counterfeit consignments",
      },
    ],
    events: [
      {
        id: "EVT-1",
        title: "Highway Intercept Checkpoint",
        description: "Police seized ₹45L counterfeit currency concealed in vehicle DL-01-CR-4402.",
        timestamp: "2026-08-30 14:00",
        type: "ARREST",
        entitiesInvolved: ["ENT-101", "ENT-104"],
      },
    ],
    evidenceReferences: [
      {
        id: "EVID-1",
        excerpt: "450 bundles of ₹500 fake Indian currency notes impounded.",
        pageOrSection: "FIR Paragraph 3",
        relevance: "Primary physical evidence",
        entitiesReferenced: ["ENT-101"],
      },
    ],
    alerts: [
      {
        title: "High Centrality Node Identified",
        description: "Entity Vikram Malhotra coordinates both print logistics and distribution.",
        severity: "CRITICAL",
      },
    ],
    aiAssessment: {
      finding: "Vikram Malhotra coordinates supply lines connecting Kolkata print facilities to Delhi distribution rings.",
      confidence: 95,
      category: "SUPPLY CHAIN CENTRALITY",
    },
  };

  const newCase = dataStore.createCaseFromExtraction({
    id: "CASE-0095",
    name: "Operation Phoenix // Counterfeit Ring",
    priority: "HIGH",
    investigator: "AGENT VERMA",
    jurisdiction: "NATIONAL — DL, WB",
    extraction: mockFIR,
    sourceInfo: {
      id: "SRC-9981",
      filename: "FIR_2026_095_Counterfeit.pdf",
      storagePath: "cases/CASE-0095/FIR/SRC-9981-FIR_2026_095.pdf",
      sourceType: "FIR",
      fileSize: 1048576,
    },
  });

  console.log("Created Case:", newCase.id, newCase.name);
  console.log("Entities in case:", newCase.entities.length);
  console.log("Evidence in case:", newCase.evidence.length);
  console.log("Timeline in case:", newCase.timeline.length);
  console.log("Alerts in case:", newCase.alerts.length);

  console.log("\n=== 2. Verifying Case Retrieval from Disk Store ===");
  const retrievedCase = dataStore.getCaseById("CASE-0095");
  if (!retrievedCase) {
    throw new Error("Case could not be retrieved from dataStore!");
  }
  console.log("Successfully retrieved from store:", retrievedCase.id, retrievedCase.name);

  console.log("\n=== 3. Testing Case List Overview Retrieval ===");
  const allCases = dataStore.getAllCases();
  console.log("Total Cases in store:", allCases.length);
  console.log("Case list item:", JSON.stringify(allCases[0], null, 2));

  console.log("\n=== ALL PERSISTENCE TESTS PASSED! ===");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
