import { NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";

export async function GET() {
  try {
    const telemetry = dataStore.getOverviewTelemetry();
    return NextResponse.json(telemetry, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch overview telemetry", details: String(error) },
      { status: 500 }
    );
  }
}
