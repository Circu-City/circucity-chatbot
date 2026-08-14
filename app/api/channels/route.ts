import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const channels = await prisma.channel.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data: channels });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const { type, name, credentials, settings } = await req.json();
    if (!type || !name) return NextResponse.json({ success: false, error: "type and name required" }, { status: 400 });
    const existing = await prisma.channel.findUnique({ where: { storeId_type: { storeId: store.id, type } } });
    if (existing) {
      const updated = await prisma.channel.update({
        where: { id: existing.id },
        data: { name, credentials, settings, status: "connected", errorMessage: null },
      });
      return NextResponse.json({ success: true, data: updated });
    }
    const channel = await prisma.channel.create({
      data: { storeId: store.id, type, name, credentials, settings, status: "connected" },
    });
    return NextResponse.json({ success: true, data: channel });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}
