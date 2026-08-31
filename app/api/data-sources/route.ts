import { NextRequest, NextResponse } from "next/server";
import { fetchDataSources } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId") || undefined;
    const sourceType = searchParams.get("sourceType") || undefined;
    const status = searchParams.get("status") || undefined;

    const result = await fetchDataSources({
      caseId,
      sourceType,
      status,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve data sources from database",
          details: result.error,
          sources: [],
          total: 0,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        sources: result.sources || [],
        total: result.total || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal error retrieving data sources",
        details: error instanceof Error ? error.message : String(error),
        sources: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
