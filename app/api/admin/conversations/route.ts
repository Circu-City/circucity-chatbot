import { NextRequest, NextResponse } from "next/server";
import { getConversations } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || undefined;
    const resolved = searchParams.get("resolved") || undefined;
    const data = await getConversations(page, 20, search, resolved);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { action, sessionId, id, agentReply, agentName, customerEmail } = body;
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    const sid = sessionId || id; if (!sid) { return NextResponse.json({ error: 'Missing conversation identifier' }, { status: 400 }); } const conversation = await prisma.conversation.findUnique({ where: { sessionId: sid } });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (action === "resolve") {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { resolved: true, escalated: false, updatedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: "Resolved" });
    }
    if (agentReply && agentReply.trim()) {
      let msgs = [];
      try { msgs = JSON.parse(conversation.messages || "[]"); } catch {}
      msgs.push({
        role: "agent",
        content: agentReply.trim(),
        agentName: agentName || "Support Agent",
        timestamp: new Date().toISOString(),
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { messages: JSON.stringify(msgs), resolved: true, escalated: false, customerEmail: customerEmail || conversation.customerEmail, updatedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: "Reply sent" });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
