import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";
import { getCaseDossier, streamInvestigatorResponse } from "@/lib/ai/investigator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const dossier = await getCaseDossier(caseId);
    if (!dossier) {
      return NextResponse.json({ error: `Case '${caseId}' not found` }, { status: 404 });
    }
    return NextResponse.json({ messages: dossier.aiMessages || [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch AI messages", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid 'message' field in request body" },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    // Verify case exists
    const dossier = await getCaseDossier(caseId);
    if (!dossier) {
      return NextResponse.json(
        { error: `Case '${caseId}' not found in active records` },
        { status: 404 }
      );
    }

    // Set up Server-Sent Events (SSE) streaming
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullAIResponse = "";

        try {
          const generator = streamInvestigatorResponse(caseId, trimmedMessage);

          for await (const chunk of generator) {
            fullAIResponse += chunk;
            const payload = JSON.stringify({ chunk });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }

          // Persist the completed turn to the case dossier
          const turn = dataStore.appendInvestigatorTurn(caseId, trimmedMessage, fullAIResponse);

          const donePayload = JSON.stringify({
            done: true,
            userMessage: turn?.userMsg || {
              id: `M-${Date.now()}-U`,
              role: "user",
              content: trimmedMessage,
              timestamp: "Just now",
            },
            aiMessage: turn?.aiMsg || {
              id: `M-${Date.now()}-A`,
              role: "ai",
              content: fullAIResponse,
              timestamp: "Just now",
            },
          });
          controller.enqueue(encoder.encode(`data: ${donePayload}\n\n`));
          controller.close();
        } catch (err) {
          console.error("[ai-chat route] Streaming error:", err);
          const errorPayload = JSON.stringify({
            error: "Streaming error during AI investigation",
            details: String(err),
          });
          controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process AI investigation query", details: String(error) },
      { status: 500 }
    );
  }
}
