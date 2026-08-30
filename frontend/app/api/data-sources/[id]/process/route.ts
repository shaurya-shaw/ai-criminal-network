import { NextRequest, NextResponse } from "next/server";
import { processDataSourceDocument } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    const result = await processDataSourceDocument(id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to process data source document with AI",
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Document analyzed and intelligence extracted successfully.",
        extraction: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error processing document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
