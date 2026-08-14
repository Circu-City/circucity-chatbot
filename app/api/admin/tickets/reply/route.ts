import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, reply, status } = body;

    if (!id) return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        adminReply: reply || null,
        status: status || "closed",
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
