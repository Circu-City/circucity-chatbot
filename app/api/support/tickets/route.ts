import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status) where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, category, priority, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Name, email, subject, and message are required" }, { status: 400 });
    }

    let userId: string | undefined;
    const token = request.cookies.get("session")?.value;
    if (token) {
      try {
        const { verifyToken } = await import("@/lib/middleware-auth");
        const session = verifyToken(token);
        if (session) userId = session.id;
      } catch {}
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        name, email, category: category || "other", priority: priority || "medium", subject, message,
        userId: userId || null,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
