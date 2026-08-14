import { NextRequest, NextResponse } from "next/server";
import { getStores, createStore } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const data = await getStores(page, 20, search, status);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const store = await createStore(body);
    return NextResponse.json({ success: true, data: store });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
