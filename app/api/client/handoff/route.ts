import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  checkRateLimit,
  corsHeadersFor,
  findActiveStoreByApiKey,
  trackWidgetEvent,
} from "@/lib/widget-api";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const h = () => corsHeadersFor(origin);
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: h() });
    }

    const { apiKey, sessionId, name, email, phone, issue } = body || {};
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400, headers: h() });
    }

    const store = await findActiveStoreByApiKey(apiKey);
    if (!store) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: h() });
    }

    if (!checkRateLimit(`handoff:${store.id}:${sessionId}`, 5, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: h() });
    }

    let conversation = await prisma.conversation.findUnique({
      where: { sessionId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          sessionId,
          storeId: store.id,
          messages: "[]",
          customerName: typeof name === "string" ? name.slice(0, 120) : null,
          customerEmail: typeof email === "string" ? email.slice(0, 200) : null,
        },
      });
    } else if (conversation.storeId !== store.id) {
      return NextResponse.json(
        { error: "Session belongs to different workspace" },
        { status: 403, headers: h() },
      );
    }

    let metadata: any = {};
    try {
      metadata = conversation.metadata ? JSON.parse(conversation.metadata) : {};
    } catch {
      metadata = {};
    }
    metadata.handoff = {
      name: typeof name === "string" ? name.slice(0, 120) : null,
      email: typeof email === "string" ? email.slice(0, 200) : null,
      phone: typeof phone === "string" ? phone.slice(0, 40) : null,
      issue: typeof issue === "string" ? issue.slice(0, 1000) : null,
      requestedAt: new Date().toISOString(),
    };

    let messages: any[] = [];
    try {
      messages = JSON.parse(conversation.messages || "[]");
    } catch {
      messages = [];
    }
    messages.push({
      role: "system",
      content: "Handoff requested — a team member will follow up.",
      timestamp: new Date().toISOString(),
    });
    messages.push({
      role: "bot",
      content:
        "Thanks — I've flagged this for a human teammate. We'll reach out" +
        (email ? ` at ${String(email).slice(0, 80)}` : " shortly") +
        ". Anything else I can help with while you wait?",
      timestamp: new Date().toISOString(),
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        escalated: true,
        handoffRequested: true,
        customerName:
          (typeof name === "string" && name.slice(0, 120)) || conversation.customerName,
        customerEmail:
          (typeof email === "string" && email.slice(0, 200)) || conversation.customerEmail,
        metadata: JSON.stringify(metadata),
        messages: JSON.stringify(messages),
        updatedAt: new Date(),
      },
    });

    await trackWidgetEvent(store.id, "handoff_request", sessionId, {
      hasEmail: !!email,
      hasPhone: !!phone,
    });

    return NextResponse.json(
      {
        ok: true,
        reply:
          "Thanks — I've flagged this for a human teammate. We'll reach out" +
          (email ? ` at ${String(email).slice(0, 80)}` : " shortly") +
          ". Anything else I can help with while you wait?",
      },
      { headers: h() },
    );
  } catch (error: any) {
    console.error("Handoff error:", error);
    return NextResponse.json({ error: "Handoff failed" }, { status: 500, headers: h() });
  }
}
