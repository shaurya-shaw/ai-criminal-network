import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";

export async function GET() {
  try {
    const settings = dataStore.getSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid 'preferences' object" },
        { status: 400 }
      );
    }

    const updated = dataStore.updatePreferences(preferences);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update preferences", details: String(error) },
      { status: 500 }
    );
  }
}
