import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";
import type { EntityType, EntityStatus } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as EntityType | "ALL" | null;
    const status = searchParams.get("status") as EntityStatus | "ALL" | null;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") as "riskScore" | "name" | "lastSeen" | null;
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;

    const entities = dataStore.getAllEntities({
      type: type || undefined,
      status: status || undefined,
      search,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    });

    const flaggedCount = entities.filter((e) => e.status === "FLAGGED").length;

    return NextResponse.json(
      {
        entities,
        total: entities.length,
        flaggedCount,
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

    const newEntity = dataStore.createEntity({
      name,
      alias,
      type: type as EntityType,
      riskScore: typeof riskScore === "number" ? riskScore : 50,
      cases: Array.isArray(cases) ? cases : [],
      status: status as EntityStatus,
    });

    return NextResponse.json(newEntity, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create entity", details: String(error) },
      { status: 500 }
    );
  }
}
