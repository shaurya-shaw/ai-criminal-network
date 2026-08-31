import { NextRequest, NextResponse } from "next/server";
import { fetchCaseDetailByIdFromDb, updateCaseInDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;

    // 1. Try Supabase first (reads case record + aggregates data_sources.extracted_data)
    try {
      const dbRes = await fetchCaseDetailByIdFromDb(caseId);
      if (dbRes.success && dbRes.data) {
        return NextResponse.json(dbRes.data, { status: 200 });
      }
    } catch (dbErr) {
      console.warn("Supabase fetchCaseDetailByIdFromDb note, checking local store:", dbErr);
    }

    // 2. Fallback to local persistent dataStore
    const localCase = dataStore.getCaseById(caseId);
    if (localCase) {
      return NextResponse.json(localCase, { status: 200 });
    }

    return NextResponse.json(
      { error: `Case '${caseId}' not found` },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve case detail", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await request.json();

    // 1. Update in local dataStore
    const updatedLocal = dataStore.updateCase(caseId, body);

    // 2. Update in Supabase
    try {
      await updateCaseInDb(caseId, {
        title: body.name,
        summary: body.brief || body.description,
        status: body.status,
        priority: body.priority,
        classification: body.classification,
        investigator: body.investigator,
        jurisdiction: body.jurisdiction,
        ai_assessment: body.aiAssessment,
      });
    } catch (dbErr) {
      console.warn("Supabase updateCaseInDb note:", dbErr);
    }

    if (!updatedLocal) {
      return NextResponse.json(
        { error: `Case '${caseId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLocal, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update case", details: String(error) },
      { status: 500 }
    );
  }
}
