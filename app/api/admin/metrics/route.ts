import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const storeId = searchParams.get("storeId") || undefined;

    const now = new Date();
    const since = new Date(now.getTime() - days * 86400000);

    const storeFilter = storeId ? { storeId } : {};

    const [totalConversations, totalMessages, usageLogs, stores, products] = await Promise.all([
      prisma.conversation.count({ where: { ...storeFilter, createdAt: { gte: since } } }),
      prisma.conversation.findMany({
        where: { ...storeFilter, createdAt: { gte: since } },
        select: { messages: true },
      }),
      prisma.usageLog.findMany({
        where: { ...storeFilter, date: { gte: since } },
        orderBy: { date: "asc" },
      }),
      prisma.store.count({ where: storeId ? { id: storeId } : {} }),
      prisma.product.count({ where: { ...storeFilter, isActive: true } }),
    ]);

    // Calculate average messages per conversation
    let msgCount = 0;
    for (const c of totalMessages) {
      try { const m = JSON.parse(c.messages); msgCount += m.length; } catch {}
    }
    const avgMessagesPerConv = totalConversations > 0 ? Math.round(msgCount / totalConversations * 10) / 10 : 0;

    // Daily message trend
    const dailyTrend = usageLogs.map((l) => ({
      date: l.date.toISOString().split("T")[0],
      messages: l.messagesCount,
    }));

    // Escalation/resolution stats
    const escalated = await prisma.conversation.count({ where: { ...storeFilter, escalated: true, createdAt: { gte: since } } });
    const resolved = await prisma.conversation.count({ where: { ...storeFilter, resolved: true, createdAt: { gte: since } } });
    const negativeSentiment = await prisma.conversation.count({ where: { ...storeFilter, sentiment: "negative", createdAt: { gte: since } } });

    return NextResponse.json({
      success: true,
      data: {
        period: { days, since: since.toISOString() },
        totals: {
          conversations: totalConversations,
          messages: msgCount,
          avgMessagesPerConv,
          stores,
          activeProducts: products,
        },
        quality: {
          escalated,
          resolved,
          escalationRate: totalConversations > 0 ? Math.round((escalated / totalConversations) * 100) : 0,
          resolutionRate: totalConversations > 0 ? Math.round((resolved / totalConversations) * 100) : 0,
          negativeSentimentRate: totalConversations > 0 ? Math.round((negativeSentiment / totalConversations) * 100) : 0,
        },
        trends: {
          daily: dailyTrend,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
