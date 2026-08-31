import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/api/data-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ networkId: string }> }
) {
  try {
    const { networkId } = await params;
    const network = dataStore.getNetworkById(networkId);

    if (!network) {
      return NextResponse.json(
        { error: `Network '${networkId}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(network, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch network detail", details: String(error) },
      { status: 500 }
    );
  }
}
