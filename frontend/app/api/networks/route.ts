import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";
import type { NetworkRiskLevel } from "@/lib/api/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const risk = searchParams.get("risk") as NetworkRiskLevel | "ALL" | null;
    const search = searchParams.get("search") || undefined;

    const networks = dataStore.getAllNetworks(risk || undefined, search);
    return NextResponse.json(
      {
        networks,
        total: networks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch networks", details: String(error) },
      { status: 500 }
    );
  }
}
