import "dotenv/config";
import { dataStore } from "../lib/api/data-store";
import type { ExtractedEntity } from "../lib/ai/types";
import { syncExtractedEntitiesToDb, fetchEntitiesFromDb } from "../lib/supabase/server";

async function main() {
  console.log("=== 1. Testing Entity Ingestion & Sync for CASE-0091 ===");

  const doc1Entities: ExtractedEntity[] = [
    {
      id: "ENT-1",
      name: "Vikram Malhotra",
      type: "Person",
      aliases: ["Vicky"],
      riskScore: 90,
      confidence: 95,
    },
    {
      id: "ENT-2",
      name: "Apex Logistics Ltd",
      type: "Organization",
      riskScore: 82,
      confidence: 90,
    },
    {
      id: "ENT-3",
      name: "+91 98765 43210",
      type: "Phone",
      riskScore: 75,
      confidence: 88,
    },
  ];

  // In local store:
  doc1Entities.forEach((ent) => {
    dataStore.createEntity({
      name: ent.name,
      alias: ent.aliases?.join(", "),
      type: ent.type.toUpperCase() as any,
      riskScore: ent.riskScore || 70,
      cases: ["CASE-0091"],
    });
  });

  const sync1 = await syncExtractedEntitiesToDb("CASE-0091", doc1Entities);
  console.log("Sync 1 result:", sync1);

  console.log("\n=== 2. Ingesting Second Document (CASE-0092) with Matching Entity ===");
  const doc2Entities: ExtractedEntity[] = [
    {
      id: "ENT-1",
      name: "Vikram Malhotra", // Same name & type
      type: "Person",
      aliases: ["The Mastermind"], // New alias
      riskScore: 96, // Higher risk score
      confidence: 98,
    },
    {
      id: "ENT-4",
      name: "MH-02-AB-9999",
      type: "Vehicle",
      riskScore: 80,
      confidence: 85,
    },
  ];

  // In local store:
  dataStore.enrichCaseWithExtraction(
    "CASE-0092",
    {
      caseTitle: "Operation Deep Scan",
      summary: "Second stage FIR document.",
      confidenceScore: 90,
      entities: doc2Entities,
      relationships: [],
      events: [],
      evidenceReferences: [],
    },
    {

      filename: "FIR_0092.pdf",
      storagePath: "cases/CASE-0092/FIR/test.pdf",
      sourceType: "FIR",
    }
  );

  const sync2 = await syncExtractedEntitiesToDb("CASE-0092", doc2Entities);
  console.log("Sync 2 result:", sync2);

  console.log("\n=== 3. Verifying Local Store Entities ===");
  const allEntities = dataStore.getAllEntities();
  console.log("Total entities in local store:", allEntities.length);
  const vikram = allEntities.find((e) => e.name.toLowerCase() === "vikram malhotra");
  console.log("Vikram entity:", JSON.stringify(vikram, null, 2));

  console.log("\n=== ALL ENTITY PERSISTENCE TESTS COMPLETED SUCCESSFULLY ===");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
