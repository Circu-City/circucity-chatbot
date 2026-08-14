import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineVisitors = await prisma.visitor.findMany({
      where: { storeId: store.id, isOnline: true, lastSeenAt: { gte: fiveMinAgo } },
      orderBy: { lastSeenAt: "desc" },
      take: 50,
    });

    const totalToday = await prisma.visitor.count({
      where: { storeId: store.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    return NextResponse.json({ success: true, data: { online: onlineVisitors, totalToday } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}
