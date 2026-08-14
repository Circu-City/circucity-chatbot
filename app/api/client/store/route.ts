import { NextResponse } from "next/server";
import { getCurrentStore, updateStoreProfile } from "@/lib/actions/client";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const data = await getCurrentStore();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const data = await updateStoreProfile(body);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}