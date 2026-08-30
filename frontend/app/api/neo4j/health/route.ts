import { NextResponse } from "next/server";
import { verifyNeo4jConnection, initializeNeo4jSchema } from "@/lib/neo4j";

export async function GET() {
  try {
    const status = await verifyNeo4jConnection();
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        configured: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const initResult = await initializeNeo4jSchema();
    return NextResponse.json(initResult, {
      status: initResult.success ? 200 : 500,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
