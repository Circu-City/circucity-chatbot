import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body || {};

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    await prisma.conversation.updateMany({
      where: { sessionId, resolved: false },
      data: { resolved: true },
    });

    return NextResponse.json({ success: true, message: "Session reset" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
