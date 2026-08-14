import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });
    const escalations = await prisma.conversation.findMany({
      where: { storeId: store.id, escalated: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, sessionId: true, messages: true, createdAt: true, updatedAt: true, customerName: true, customerEmail: true, resolved: true, escalated: true, escalationReason: true, agentName: true },
    });
    return NextResponse.json({ success: true, data: escalations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const body = await request.json();
    const { conversationId, reply, resolved } = body;
    if (!conversationId) return NextResponse.json({ success: false, error: "conversationId is required" }, { status: 400 });

    const conv = await prisma.conversation.findFirst({ where: { id: conversationId, storeId: store.id } });
    if (!conv) return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });

    const updateData: any = {};
    if (reply) {
      const messages = (conv.messages as any[]) || [];
      messages.push({ role: "agent", content: reply, agentName: session.name || "Agent", timestamp: new Date().toISOString() });
      updateData.messages = messages;
    }
    if (resolved !== undefined) updateData.resolved = resolved;
    await prisma.conversation.update({ where: { id: conversationId }, data: updateData });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
