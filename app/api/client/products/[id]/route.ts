import { NextRequest, NextResponse } from "next/server";
import { deleteStoreProduct } from "@/lib/actions/client";
import { requireAuth } from "@/lib/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    await deleteStoreProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}