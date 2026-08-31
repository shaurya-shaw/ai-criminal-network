import { NextRequest, NextResponse } from "next/server";
import { fetchDataSourceById, deleteDataSourceRecord } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    const result = await fetchDataSourceById(id);

    if (!result.success || !result.source) {
      return NextResponse.json(
        {
          error: "Data source not found",
          details: result.error || `No record found with ID '${id}'`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        source: result.source,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error retrieving data source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    const res = await deleteDataSourceRecord(id);

    if (!res.success) {
      return NextResponse.json(
        {
          error: "Failed to delete data source",
          details: res.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Data source ${id} deleted successfully from database and storage.`,
        id,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error deleting data source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
