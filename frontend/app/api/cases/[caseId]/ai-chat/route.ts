import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'message' field in body" },
        { status: 400 }
      );
    }

    const aiMessage = dataStore.appendAIMessage(caseId, message);
    if (!aiMessage) {
      return NextResponse.json(
        { error: `Case '${caseId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: aiMessage }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process AI chat message", details: String(error) },
      { status: 500 }
    );
  }
}
