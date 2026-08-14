import { NextRequest, NextResponse } from "next/server";
import { getStoreAnalytics } from "@/lib/actions/client";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const data = await getStoreAnalytics(range);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
