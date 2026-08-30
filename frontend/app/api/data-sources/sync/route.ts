import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";

export async function POST(request: NextRequest) {
  try {
    let sourceId: string | undefined = undefined;
    try {
      const body = await request.json();
      sourceId = body?.sourceId;
    } catch {
      // Empty body allowed to sync all
    }

    const syncResult = dataStore.syncDataSources(sourceId);
    return NextResponse.json(syncResult, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to trigger data source synchronization", details: String(error) },
      { status: 500 }
    );
  }
}
