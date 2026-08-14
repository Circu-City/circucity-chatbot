import { NextRequest, NextResponse } from "next/server";
import { getApiKeys, createApiKey } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const data = await getApiKeys(page, 20);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { storeId, name, permissions } = body;
    if (!storeId || !name) {
      return NextResponse.json({ success: false, error: "storeId and name are required" }, { status: 400 });
    }
    const apiKey = await createApiKey({ storeId, name, permissions });
    return NextResponse.json({ success: true, data: apiKey });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}