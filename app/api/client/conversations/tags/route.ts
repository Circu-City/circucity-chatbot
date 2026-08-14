import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const body = await request.json();
    const { conversationId, tags } = body;
    if (!conversationId) return NextResponse.json({ success: false, error: "conversationId is required" }, { status: 400 });

    const conv = await prisma.conversation.findFirst({ where: { id: conversationId, storeId: store.id } });
    if (!conv) return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });

    let meta: any = {};
    if (conv.metadata) { try { meta = JSON.parse(conv.metadata); } catch {} }
    meta.tags = Array.isArray(tags) ? tags : [];
    await prisma.conversation.update({ where: { id: conversationId }, data: { metadata: JSON.stringify(meta) } });

    return NextResponse.json({ success: true, data: { tags: meta.tags } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
