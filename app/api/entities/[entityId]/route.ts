import { NextRequest, NextResponse } from "next/server";
import { fetchEntityByIdFromDb, updateEntityInDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import type { Entity } from "@/lib/api/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;

    // 1. Try Supabase first
    try {
      const dbRes = await fetchEntityByIdFromDb(entityId);
      if (dbRes.success && dbRes.data) {
        const mappedEntity: Entity = {
          id: dbRes.data.id,
          name: dbRes.data.name,
          alias: dbRes.data.alias || undefined,
          type: dbRes.data.type,
          riskScore: dbRes.data.risk_score,
          cases: dbRes.data.cases || [],
          lastSeen: dbRes.data.last_seen,
          status: dbRes.data.status,
          attributes: dbRes.data.attributes || undefined,
        };
        return NextResponse.json(mappedEntity, { status: 200 });
      }
    } catch (dbErr) {
      console.warn("Supabase fetchEntityByIdFromDb note:", dbErr);
    }

    // 2. Fallback to local store
    const localEntity = dataStore.getEntityById(entityId);
    if (!localEntity) {
      return NextResponse.json(
        { error: `Entity '${entityId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(localEntity, { status: 200 });
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

    // 1. Update in local store
    const updatedLocal = dataStore.updateEntity(entityId, body);

    // 2. Update in Supabase
    try {
      await updateEntityInDb(entityId, {
        name: body.name,
        alias: body.alias,
        type: body.type,
        risk_score: body.riskScore,
        status: body.status,
        cases: body.cases,
        last_seen: body.lastSeen,
        attributes: body.attributes,
      });
    } catch (dbErr) {
      console.warn("Supabase updateEntityInDb note:", dbErr);
    }

    if (!updatedLocal) {
      return NextResponse.json(
        { error: `Entity '${entityId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLocal, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update entity", details: String(error) },
      { status: 500 }
    );
  }
}
