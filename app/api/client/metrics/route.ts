import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date(Date.now() - days * 86400000);

    const conversations = await prisma.conversation.findMany({
      where: { storeId: store.id, createdAt: { gte: startDate } },
      select: { id: true, messages: true, resolved: true, escalated: true, sentiment: true, createdAt: true },
    });

    const usageLogs = await prisma.usageLog.findMany({
      where: { storeId: store.id, date: { gte: startDate } },
      orderBy: { date: "asc" },
    });

    const totalMessages = usageLogs.reduce((s, l) => s + l.messagesCount, 0);
    const totalConversations = conversations.length;
    const escalated = conversations.filter(c => c.escalated).length;
    const resolved = conversations.filter(c => c.resolved).length;
    const negativeSentiment = conversations.filter(c => c.sentiment === "negative").length;

    const dailyMap: Record<string, number> = {};
    usageLogs.forEach(l => { dailyMap[l.date.toISOString().slice(0, 10)] = (dailyMap[l.date.toISOString().slice(0, 10)] || 0) + l.messagesCount; });
    const daily = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, messages]) => ({ date, messages }));

    return NextResponse.json({
      success: true,
      data: {
        period: { days },
        totals: { conversations: totalConversations, messages: totalMessages, avgMessagesPerConv: totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : "0" },
        quality: { escalated, resolved, escalationRate: totalConversations > 0 ? Math.round(escalated / totalConversations * 100) : 0, resolutionRate: totalConversations > 0 ? Math.round(resolved / totalConversations * 100) : 0, negativeSentimentRate: totalConversations > 0 ? Math.round(negativeSentiment / totalConversations * 100) : 0 },
        trends: { daily },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
