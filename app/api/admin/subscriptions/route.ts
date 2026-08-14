import { NextRequest, NextResponse } from "next/server";
import { getSubscriptions } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const plan = searchParams.get("plan") || undefined;
    const status = searchParams.get("status") || undefined;
    const data = await getSubscriptions(page, 20, plan, status);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}