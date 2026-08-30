import { NextResponse } from "next/server";
import { listAllIntelligenceFiles } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { files, totalBytes, error } = await listAllIntelligenceFiles();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to list files from Supabase Storage",
          details: error,
          files: [],
          total: 0,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        files: files || [],
        total: files?.length || 0,
        totalBytes: totalBytes || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal error retrieving data sources",
        details: error instanceof Error ? error.message : String(error),
        files: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
