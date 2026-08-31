import { NextRequest, NextResponse } from "next/server";
import { syncDataSourceGraph } from "@/lib/neo4j/case-graph";

/**
 * Compatibility endpoint. Graph import is intentionally source-atomic so an
 * entity-only request cannot leave unscoped Neo4j records behind.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.dataSourceId) {
    return NextResponse.json({ success: false, error: 'Missing required field "dataSourceId".' }, { status: 400 });
  }
  try {
    const diagnostics = await syncDataSourceGraph(body.dataSourceId);
    return NextResponse.json({ success: true, mode: "full-source-sync", diagnostics });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
