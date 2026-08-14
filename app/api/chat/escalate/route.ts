import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET: List escalated conversations for a store/admin
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("apiKey") || "";

  if (!apiKey) {
    return NextResponse.json({ error: "Missing apiKey" }, { status: 400, headers: corsHeaders });
  }

  try {
    const store = await prisma.store.findFirst({
      where: { apiKey, status: "active" },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: corsHeaders });
    }

    const conversations = await prisma.conversation.findMany({
      where: { storeId: store.id, escalated: true, resolved: false },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const parsed = conversations.map((c) => {
      let msgs: any[] = [];
      try { msgs = JSON.parse(c.messages || "[]"); } catch {}
      return {
        id: c.id,
        sessionId: c.sessionId,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        sentiment: c.sentiment,
        pageUrl: c.pageUrl,
        messageCount: msgs.length,
        lastMessage: msgs[msgs.length - 1]?.content?.substring(0, 200) || "",
        lastMessageTime: c.updatedAt,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ success: true, conversations: parsed }, { headers: corsHeaders });
  } catch (err) {
    console.error("Escalated conversations fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500, headers: corsHeaders });
  }
}

// POST: Escalate a conversation, or resolve it
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
    }

    const { sessionId, apiKey, action, agentReply, agentName, customerName, customerEmail } = body || {};

    if (!sessionId || !apiKey) {
      return NextResponse.json({ error: "Missing sessionId or apiKey" }, { status: 400, headers: corsHeaders });
    }

    const store = await prisma.store.findFirst({
      where: { apiKey, status: "active" },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: corsHeaders });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { sessionId },
    });

    if (!conversation || conversation.storeId !== store.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404, headers: corsHeaders });
    }

    if (action === "resolve") {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { resolved: true, escalated: false, updatedAt: new Date() },
      });

      return NextResponse.json({ success: true, message: "Conversation resolved" }, { headers: corsHeaders });
    }

    // Send agent reply
    if (agentReply && agentReply.trim()) {
      let msgs: any[] = [];
      try { msgs = JSON.parse(conversation.messages || "[]"); } catch {}

      const agentMessage = {
        role: "agent",
        content: agentReply.trim(),
        agentName: agentName || "Support Agent",
        timestamp: new Date().toISOString(),
      };
      msgs.push(agentMessage);

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          messages: JSON.stringify(msgs),
          resolved: true,
          escalated: false,
          customerName: customerName || conversation.customerName,
          customerEmail: customerEmail || conversation.customerEmail,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "Reply sent" }, { headers: corsHeaders });
    }

    // Escalate conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        escalated: true,
        customerName: customerName || conversation.customerName,
        customerEmail: customerEmail || conversation.customerEmail,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Conversation escalated" }, { headers: corsHeaders });
  } catch (err) {
    console.error("Escalate error:", err);
    return NextResponse.json({ error: "Failed to process" }, { status: 500, headers: corsHeaders });
  }
}
