import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const entity = dataStore.getEntityById(entityId);

    if (!entity) {
      return NextResponse.json(
        { error: `Entity '${entityId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(entity, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch entity detail", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const body = await request.json();

    const updated = dataStore.updateEntity(entityId, body);
    if (!updated) {
      return NextResponse.json(
        { error: `Entity '${entityId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update entity", details: String(error) },
      { status: 500 }
    );
  }
}
