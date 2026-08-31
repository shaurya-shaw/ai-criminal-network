import { NextResponse } from "next/server";
import { fetchOverviewTelemetryFromDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";

export async function GET() {
  try {
    // 1. Try to fetch live, aggregated telemetry from Supabase Postgres
    const dbRes = await fetchOverviewTelemetryFromDb();

    if (dbRes.success && dbRes.data) {
      return NextResponse.json(dbRes.data, { status: 200 });
    }

    // 2. Fallback to local data store if DB unreachable
    console.warn("Supabase overview fetch failed, falling back to dataStore:", dbRes.error);
    const localTelemetry = dataStore.getOverviewTelemetry();
    return NextResponse.json(localTelemetry, { status: 200 });
  } catch (error) {
    console.error("GET /api/overview error:", error);
    try {
      const localTelemetry = dataStore.getOverviewTelemetry();
      return NextResponse.json(localTelemetry, { status: 200 });
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch overview telemetry", details: String(error) },
        { status: 500 }
      );
    }
  }
}
