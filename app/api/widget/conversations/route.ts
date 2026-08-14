import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { corsHeadersFor, findActiveStoreByApiKey, checkRateLimit } from "@/lib/widget-api";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const h = () => corsHeadersFor(origin);
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("key") || "";
  const visitorId = searchParams.get("visitorId") || "";
  const limitParam = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Math.min(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20, 50);

  if (!visitorId) {
    return NextResponse.json({ success: false, error: "Missing visitorId" }, { status: 400, headers: h() });
  }

  if (!checkRateLimit("widget-conversations:" + visitorId, 30, 60_000)) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: h() });
  }

  const store = await findActiveStoreByApiKey(apiKey);
  if (!store) {
    return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401, headers: h() });
  }

  // Scoped by storeId AND visitorId — never fall back to an unscoped query here.
  // This route exists specifically because /api/chat/conversations (storeId only)
  // returns every visitor's conversations and must never be exposed to the widget.
  const conversations = await prisma.conversation.findMany({
    where: { storeId: store.id, visitorId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { sessionId: true, messages: true, updatedAt: true, createdAt: true },
  });

  const result = conversations.map((c) => {
    let title = "New conversation";
    let messageCount = 0;
    try {
      const msgs = JSON.parse(c.messages || "[]");
      messageCount = Array.isArray(msgs) ? msgs.length : 0;
      const firstUser = Array.isArray(msgs) ? msgs.find((m: any) => m.role === "user") : null;
      if (firstUser && firstUser.content) {
        title = String(firstUser.content).slice(0, 80);
        if (String(firstUser.content).length > 80) title += "...";
      }
    } catch {}
    return {
      sessionId: c.sessionId,
      title,
      messageCount,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    };
  });

  return NextResponse.json({ success: true, data: result }, { headers: h() });
}
