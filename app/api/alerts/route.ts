import { NextRequest, NextResponse } from "next/server";
import { fetchAlertsFromDb, createAlertInDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import type { AlertSeverity, AlertStatus, GlobalAlert } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity") as AlertSeverity | "ALL" | null;
    const status = searchParams.get("status") as AlertStatus | "ALL" | null;
    const caseId = searchParams.get("caseId") || undefined;

    // 1. Try Supabase persistent alerts table
    try {
      const dbRes = await fetchAlertsFromDb({
        severity: severity || undefined,
        status: status || undefined,
        caseId,
      });

      if (dbRes.success && dbRes.alerts && dbRes.alerts.length > 0) {
        const mappedAlerts: GlobalAlert[] = dbRes.alerts.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          severity: a.severity,
          status: a.status,
          caseId: a.case_id,
          timestamp: a.created_at ? new Date(a.created_at).toLocaleString() : "Just now",
        }));

        const newCount = mappedAlerts.filter((a) => a.status === "NEW").length;
        const criticalCount = mappedAlerts.filter((a) => a.severity === "CRITICAL").length;

        return NextResponse.json(
          {
            alerts: mappedAlerts,
            total: mappedAlerts.length,
            newCount,
            criticalCount,
            source: "supabase",
          },
          { status: 200 }
        );
      }
    } catch (dbErr) {
      console.warn("Supabase fetchAlertsFromDb note, checking local store:", dbErr);
    }

    // 2. Fallback to local store
    const localAlerts = dataStore.getAllAlerts({
      severity: severity || undefined,
      status: status || undefined,
      caseId,
    });

    const newCount = localAlerts.filter((a) => a.status === "NEW").length;
    const criticalCount = localAlerts.filter((a) => a.severity === "CRITICAL").length;

    return NextResponse.json(
      {
        alerts: localAlerts,
        total: localAlerts.length,
        newCount,
        criticalCount,
        source: "local-store",
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

    // 1. Create in local store
    const newAlert = dataStore.createAlert({
      title,
      description,
      severity: (severity as AlertSeverity) || "INFO",
      caseId,
    });

    // 2. Persist in Supabase
    try {
      await createAlertInDb({
        id: newAlert.id,
        case_id: caseId,
        title,
        description,
        severity: (severity as AlertSeverity) || "INFO",
        status: "NEW",
      });
    } catch (dbErr) {
      console.warn("Supabase createAlertInDb note:", dbErr);
    }

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create alert", details: String(error) },
      { status: 500 }
    );
  }
}
