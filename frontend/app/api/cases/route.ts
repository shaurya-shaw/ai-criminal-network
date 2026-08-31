import { NextRequest, NextResponse } from "next/server";
import { fetchCasesFromDb, createCaseInDb } from "@/lib/supabase/server";
import { dataStore } from "@/lib/api/data-store";
import type { CaseStatus, Priority } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CaseStatus | "ALL" | null;
    const search = searchParams.get("search") || undefined;

    // 1. Try fetching persistent cases from Supabase
    try {
      const dbRes = await fetchCasesFromDb({ status: status || undefined, search });
      if (dbRes.success && dbRes.cases && dbRes.cases.length > 0) {
        return NextResponse.json(
          {
            cases: dbRes.cases,
            total: dbRes.cases.length,
            source: "supabase",
          },
          { status: 200 }
        );
      }
    } catch (dbErr) {
      console.warn("Supabase fetchCasesFromDb note, checking local store:", dbErr);
    }

    // 2. Fallback to local persistent dataStore
    const localCases = dataStore.getAllCases(status || undefined, search);
    return NextResponse.json(
      {
        cases: localCases,
        total: localCases.length,
        source: "local-store",
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

    // 1. Persist in local dataStore
    const newCase = dataStore.createCase({
      name,
      description,
      priority: (priority as Priority) || "MEDIUM",
      investigator,
      jurisdiction: jurisdiction || "NATIONAL",
      classification,
      brief,
    });

    // 2. Persist in Supabase PostgreSQL
    try {
      await createCaseInDb({
        id: newCase.id,
        case_number: newCase.id,
        title: name,
        summary: description,
        classification: classification || "RESTRICTED // LEVEL-2",
        status: "ACTIVE",
        priority: (priority as Priority) || "MEDIUM",
        investigator,
        jurisdiction: jurisdiction || "NATIONAL",
      });
    } catch (dbErr) {
      console.warn("Supabase createCaseInDb note:", dbErr);
    }

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create case", details: String(error) },
      { status: 500 }
    );
  }
}
