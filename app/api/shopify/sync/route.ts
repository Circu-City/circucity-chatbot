import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getShopifyChannel, syncShopifyCatalog } from "@/lib/shopify/sync";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      select: { id: true, apiKey: true },
    });
    if (!store) {
      return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    }
    const channel = await getShopifyChannel(store.id);
    if (!channel || channel.status !== "connected") {
      return NextResponse.json({ success: true, connected: false, data: null });
    }
    let settings: any = {};
    try {
      settings = channel.settings ? JSON.parse(channel.settings) : {};
    } catch {}
    return NextResponse.json({
      success: true,
      connected: true,
      data: {
        name: channel.name,
        lastSyncAt: channel.lastSyncAt,
        settings,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!store) {
      return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    }
    const summary = await syncShopifyCatalog(store.id);
    return NextResponse.json({ success: true, data: summary });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
