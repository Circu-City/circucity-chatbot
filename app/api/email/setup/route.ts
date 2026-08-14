import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const emailChannel = await prisma.emailChannel.findUnique({ where: { storeId: store.id } });
    if (!emailChannel) return NextResponse.json({ success: false, error: "Not configured" }, { status: 404 });
    const { smtpPass, imapPass, ...safe } = emailChannel;
    return NextResponse.json({ success: true, data: safe });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const { email, smtpHost, smtpPort, smtpUser, smtpPass, imapHost, imapPort, imapUser, imapPass, useSSL } = await req.json();
    const data = await prisma.emailChannel.upsert({
      where: { storeId: store.id },
      create: { storeId: store.id, email, smtpHost, smtpPort: smtpPort || 587, smtpUser, smtpPass, imapHost, imapPort: imapPort || 993, imapUser, imapPass, useSSL: useSSL ?? true },
      update: { email, smtpHost, smtpPort: smtpPort || 587, smtpUser, smtpPass, imapHost, imapPort: imapPort || 993, imapUser, imapPass, useSSL: useSSL ?? true, verified: false },
    });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const body = await req.json();
    const data = await prisma.emailChannel.update({ where: { storeId: store.id }, data: body });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
