import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true, crawlData: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const openEscalations = await prisma.conversation.count({ where: { storeId: store.id, escalated: true, resolved: false } });

    let unansweredCount = 0;
    if (store.crawlData) { try { const cd = JSON.parse(store.crawlData); unansweredCount = (cd.unanswered || []).length; } catch {} }

    const recentEsc = await prisma.conversation.findMany({
      where: { storeId: store.id, escalated: true, resolved: false },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, customerName: true, escalationReason: true, updatedAt: true },
    });

    let settings: any = { emailAlerts: true, escalationAlerts: true, weeklyDigest: false };
    const storeMeta = await prisma.store.findFirst({ where: { id: store.id }, select: { metadata: true } });
    if (storeMeta?.metadata) { try { const sm = JSON.parse(storeMeta.metadata); if (sm.notifications) settings = { ...settings, ...sm.notifications }; } catch {} }

    const notifications: any[] = [];
    if (openEscalations > 0) {
      notifications.push({ type: "escalation", title: openEscalations + " open escalation" + (openEscalations > 1 ? "s" : ""), count: openEscalations, items: recentEsc });
    }
    if (unansweredCount > 0) {
      notifications.push({ type: "unanswered", title: unansweredCount + " unanswered question" + (unansweredCount > 1 ? "s" : ""), count: unansweredCount });
    }

    return NextResponse.json({ success: true, data: { notifications, settings, openEscalations, unansweredCount } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true, metadata: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const body = await request.json();
    let meta: any = {};
    if (store.metadata) { try { meta = JSON.parse(store.metadata); } catch {} }
    const allowed = ["emailAlerts", "escalationAlerts", "weeklyDigest", "productUpdates", "weeklyReport"];
    const filtered: any = {};
    for (const key of allowed) { if (body[key] !== undefined) filtered[key] = body[key]; }
    meta.notifications = { ...(meta.notifications || {}), ...filtered };
    await prisma.store.update({ where: { id: store.id }, data: { metadata: JSON.stringify(meta) } });

    return NextResponse.json({ success: true, data: meta.notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
