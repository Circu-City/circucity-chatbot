import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get("apiKey");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing apiKey" }, { status: 400, headers: corsHeaders });
  }

  const store = await prisma.store.findFirst({
    where: { apiKey, status: "active" },
  });

  if (!store) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: corsHeaders });
  }

  const conversations = await prisma.conversation.findMany({
    where: { storeId: store.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      sessionId: true,
      messages: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  const result = conversations.map((c) => {
    let title = "New conversation";
    try {
      const msgs = JSON.parse(c.messages || "[]");
      const firstUser = msgs.find((m: any) => m.role === "user");
      if (firstUser && firstUser.content) {
        title = firstUser.content.substring(0, 80);
        if (firstUser.content.length > 80) title += "...";
      }
    } catch {}
    return {
      sessionId: c.sessionId,
      title,
      messageCount: (() => { try { return JSON.parse(c.messages || "[]").length; } catch { return 0; } })(),
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    };
  });

  return NextResponse.json(result, { headers: corsHeaders });
}
