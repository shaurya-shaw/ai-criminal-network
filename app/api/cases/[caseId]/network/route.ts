import { NextResponse } from "next/server";
import { syncAndReadCaseGraph } from "@/lib/neo4j/case-graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  if (!caseId?.trim()) {
    return NextResponse.json({ error: "Case ID is required." }, { status: 400 });
  }

  try {
    // Synchronizing here backfills historical JSONB safely before returning the
    // Neo4j projection. Future document processing performs this proactively.
    const { graph, sync } = await syncAndReadCaseGraph(caseId);
    return NextResponse.json({ ...graph, diagnostics: sync }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    const unavailable = /Neo4j driver is not configured|NEO4J_|connection|connect|schema initialization/i.test(message);
    return NextResponse.json(
      {
        error: unavailable ? "Investigation graph is currently unavailable." : "Failed to load investigation graph.",
        details: message,
      },
      { status: unavailable ? 503 : 500 },
    );
  }
}
