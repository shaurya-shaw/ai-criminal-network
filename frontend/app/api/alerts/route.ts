import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";
import type { AlertSeverity, AlertStatus } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") as AlertSeverity | "ALL" | null;
    const status = searchParams.get("status") as AlertStatus | "ALL" | null;
    const caseId = searchParams.get("caseId") || undefined;

    const alerts = dataStore.getAllAlerts({
      severity: severity || undefined,
      status: status || undefined,
      caseId,
    });

    const newCount = alerts.filter((a) => a.status === "NEW").length;
    const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;

    return NextResponse.json(
      {
        alerts,
        total: alerts.length,
        newCount,
        criticalCount,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch alerts", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, severity, caseId } = body;

    if (!title || !description || !caseId) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, caseId" },
        { status: 400 }
      );
    }

    const newAlert = dataStore.createAlert({
      title,
      description,
      severity: (severity as AlertSeverity) || "INFO",
      caseId,
    });

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create alert", details: String(error) },
      { status: 500 }
    );
  }
}
