import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const caseItem = dataStore.getCaseById(caseId);

    if (!caseItem) {
      return NextResponse.json(
        { error: `Case '${caseId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(caseItem, { status: 200 });
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

    const updated = dataStore.updateCase(caseId, body);
    if (!updated) {
      return NextResponse.json(
        { error: `Case '${caseId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update case", details: String(error) },
      { status: 500 }
    );
  }
}
