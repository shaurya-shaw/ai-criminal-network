import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";
import type { CaseStatus, Priority } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CaseStatus | "ALL" | null;
    const search = searchParams.get("search") || undefined;

    const cases = dataStore.getAllCases(status || undefined, search);
    return NextResponse.json(
      {
        cases,
        total: cases.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cases", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, priority, investigator, jurisdiction, classification, brief } = body;

    if (!name || !description || !investigator) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, investigator" },
        { status: 400 }
      );
    }

    const newCase = dataStore.createCase({
      name,
      description,
      priority: (priority as Priority) || "MEDIUM",
      investigator,
      jurisdiction: jurisdiction || "NATIONAL",
      classification,
      brief,
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create case", details: String(error) },
      { status: 500 }
    );
  }
}
