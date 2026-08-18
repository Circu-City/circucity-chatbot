import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { userId } = await params;

  const messages = await prisma.staffMessage.findMany({
    where: { OR: [{ senderId: admin.id, recipientId: userId }, { senderId: userId, recipientId: admin.id }] },
    include: { sender: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  await prisma.staffMessage.updateMany({
    where: { senderId: userId, recipientId: admin.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ success: true, messages, adminId: admin.id });
}
