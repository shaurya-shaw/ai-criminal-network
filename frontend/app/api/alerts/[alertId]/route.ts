import { NextRequest, NextResponse } from "next/server";
import { updateAlertStatusInDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import type { AlertStatus } from "@/lib/api/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["NEW", "ACKNOWLEDGED", "RESOLVED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be NEW, ACKNOWLEDGED, or RESOLVED" },
        { status: 400 }
      );
    }

    // 1. Update in local store
    const updated = dataStore.updateAlertStatus(alertId, status as AlertStatus);

    // 2. Update in Supabase
    try {
      await updateAlertStatusInDb(alertId, status as AlertStatus);
    } catch (dbErr) {
      console.warn("Supabase updateAlertStatusInDb note:", dbErr);
    }

    if (!updated) {
      return NextResponse.json(
        { error: `Alert '${alertId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update alert status", details: String(error) },
      { status: 500 }
    );
  }
}
