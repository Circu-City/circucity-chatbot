import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const messages = await prisma.staffMessage.findMany({
    where: { OR: [{ senderId: admin.id }, { recipientId: admin.id }] },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      recipient: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const threads = new Map<string, any>();
  for (const m of messages) {
    const other = m.senderId === admin.id ? m.recipient : m.sender;
    if (!threads.has(other.id)) {
      threads.set(other.id, {
        user: { id: other.id, name: other.name, email: other.email },
        lastMessage: m,
        unread: 0,
      });
    }
    if (m.recipientId === admin.id && !m.readAt) threads.get(other.id).unread++;
  }

  return NextResponse.json({
    success: true,
    threads: [...threads.values()].sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()),
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { recipientId, body } = await req.json();
  if (!recipientId || !body?.trim()) return NextResponse.json({ error: "recipientId and body required" }, { status: 400 });

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) return NextResponse.json({ error: "Recipient has no in-app account. Use email instead." }, { status: 400 });

  const message = await prisma.staffMessage.create({
    data: { senderId: admin.id, recipientId, body: body.trim() },
  });
  await prisma.staffActivity.create({
    data: {
      userId: admin.id,
      action: "message_sent",
      details: `Message to ${recipient.name || recipient.email}: ${body.trim().slice(0, 120)}`,
    },
  });
  return NextResponse.json({ success: true, message });
}
