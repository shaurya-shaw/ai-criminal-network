import { NextRequest, NextResponse } from "next/server";
import { updateDataSourceStatus, DataSourceStatus } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const VALID_STATUSES: DataSourceStatus[] = [
  "UPLOADED",
  "PROCESSING",
  "REVIEW",
  "IMPORTED",
  "FAILED",
];

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = body?.status as DataSourceStatus;

    if (!id) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status '${status}'. Allowed values: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const res = await updateDataSourceStatus(id, status);

    if (!res.success) {
      return NextResponse.json(
        {
          error: "Failed to update data source status",
          details: res.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Data source status updated to ${status}`,
        id,
        status,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal error updating status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
