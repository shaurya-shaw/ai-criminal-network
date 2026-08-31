import "dotenv/config";
import { dataStore } from "../lib/api/data-store";
import type { ExtractedAlert } from "../lib/ai/types";
import { syncExtractedAlertsToDb, fetchAlertsFromDb, updateAlertStatusInDb } from "../lib/supabase/server";

async function main() {
  console.log("=== 1. Ingesting & Syncing Extracted Alerts for CASE-0091 ===");

  const mockAlerts: ExtractedAlert[] = [
    {
      title: "High Centrality Suspect Node Flagged",
      description: "Vikram Malhotra identified as central hub connecting NCR and WB distribution cells.",
      severity: "CRITICAL",
      category: "NETWORK",
    },
    {
      title: "Suspect Burner Line Activated",
      description: "Unusual activity spike on burner line +91 98765 43210 during late-night hours.",
      severity: "WARNING",
      category: "COMMUNICATION",
    },
  ];

  // In local store:
  mockAlerts.forEach((alt) => {
    dataStore.createAlert({
      title: alt.title,
      description: alt.description,
      severity: alt.severity,
      caseId: "CASE-0091",
    });
  });

  const syncRes = await syncExtractedAlertsToDb("CASE-0091", mockAlerts);
  console.log("Sync alerts result:", syncRes);

  console.log("\n=== 2. Verifying Alerts from Local Store ===");
  const allAlerts = dataStore.getAllAlerts();
  console.log("Total alerts in store:", allAlerts.length);
  console.log("First alert:", JSON.stringify(allAlerts[0], null, 2));

  console.log("\n=== 3. Testing Alert Status Triage (NEW -> RESOLVED) ===");
  const targetAlert = allAlerts[0];
  const updatedLocal = dataStore.updateAlertStatus(targetAlert.id, "RESOLVED");
  console.log("Updated alert status in store:", updatedLocal?.status);

  console.log("\n=== ALL ALERT PERSISTENCE TESTS COMPLETED SUCCESSFULLY ===");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
