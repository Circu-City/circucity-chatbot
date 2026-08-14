import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      select: { id: true, metadata: true },
    });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    let meta: any = {};
    if (store.metadata) { try { meta = JSON.parse(store.metadata); } catch {} }

    const defaults = {
      emailAlerts: true,
      escalationAlerts: true,
      weeklyDigest: false,
      soundAlerts: true,
      pushAlerts: false,
      securityAlerts: true,
    };

    return NextResponse.json({
      success: true,
      data: { ...defaults, ...(meta.notifications || {}) },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      select: { id: true, metadata: true },
    });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const body = await request.json();
    let meta: any = {};
    if (store.metadata) { try { meta = JSON.parse(store.metadata); } catch {} }

    const allowed = [
      "emailAlerts", "escalationAlerts", "weeklyDigest",
      "productUpdates", "weeklyReport", "soundAlerts",
      "pushAlerts", "securityAlerts",
    ];
    const filtered: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) filtered[key] = body[key];
    }

    meta.notifications = { ...(meta.notifications || {}), ...filtered };
    await prisma.store.update({
      where: { id: store.id },
      data: { metadata: JSON.stringify(meta) },
    });

    return NextResponse.json({ success: true, data: meta.notifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
