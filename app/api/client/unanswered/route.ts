import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true, crawlData: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    let unanswered: any[] = [];
    if (store.crawlData) { try { const cd = JSON.parse(store.crawlData); unanswered = cd.unanswered || []; } catch {} }
    return NextResponse.json({ success: true, data: unanswered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
