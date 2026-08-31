import { NextRequest, NextResponse } from "next/server";
import { fetchEntitiesFromDb, createEntityInDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import type { EntityType, EntityStatus, Entity } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as EntityType | "ALL" | null;
    const status = searchParams.get("status") as EntityStatus | "ALL" | null;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") as "riskScore" | "name" | "lastSeen" | null;
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;

    // 1. Query persistent Supabase entities table
    try {
      const dbRes = await fetchEntitiesFromDb({
        type: type || undefined,
        status: status || undefined,
        search,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      });

      if (dbRes.success && dbRes.entities && dbRes.entities.length > 0) {
        const mappedEntities: Entity[] = dbRes.entities.map((e) => ({
          id: e.id,
          name: e.name,
          alias: e.alias || undefined,
          type: e.type,
          riskScore: e.risk_score,
          cases: e.cases || [],
          lastSeen: e.last_seen,
          status: e.status,
          attributes: e.attributes || undefined,
        }));

        const flaggedCount = mappedEntities.filter((e) => e.status === "FLAGGED").length;

        return NextResponse.json(
          {
            entities: mappedEntities,
            total: mappedEntities.length,
            flaggedCount,
            source: "supabase",
          },
          { status: 200 }
        );
      }
    } catch (dbErr) {
      console.warn("Supabase fetchEntitiesFromDb note, falling back to local store:", dbErr);
    }

    // 2. Fallback to local persistent store
    const localEntities = dataStore.getAllEntities({
      type: type || undefined,
      status: status || undefined,
      search,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    });

    const flaggedCount = localEntities.filter((e) => e.status === "FLAGGED").length;

    return NextResponse.json(
      {
        entities: localEntities,
        total: localEntities.length,
        flaggedCount,
        source: "local-store",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch entities", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, alias, type, riskScore, cases, status } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }

    // 1. Create in local persistent store
    const newEntity = dataStore.createEntity({
      name,
      alias,
      type: type as EntityType,
      riskScore: typeof riskScore === "number" ? riskScore : 50,
      cases: Array.isArray(cases) ? cases : [],
      status: status as EntityStatus,
    });

    // 2. Persist in Supabase Postgres
    try {
      await createEntityInDb({
        id: newEntity.id,
        name: newEntity.name,
        alias: newEntity.alias,
        type: newEntity.type,
        risk_score: newEntity.riskScore,
        cases: newEntity.cases,
        status: newEntity.status,
        last_seen: newEntity.lastSeen,
      });
    } catch (dbErr) {
      console.warn("Supabase createEntityInDb note:", dbErr);
    }

    return NextResponse.json(newEntity, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create entity", details: String(error) },
      { status: 500 }
    );
  }
}
