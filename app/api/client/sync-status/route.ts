import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function parseCrawlData(raw: string | null): { pages?: any[]; products?: any[]; faqs?: any[] } {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const store = await prisma.store.findFirst({
      where: { userId: session.id, status: "active" },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, error: "No store found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const crawlInfo = parseCrawlData(store.crawlData);
    const activeProducts = await prisma.product.count({ where: { storeId: store.id, isActive: true } });
    const totalProducts = await prisma.product.count({ where: { storeId: store.id } });
    const totalConversations = await prisma.conversation.count({ where: { storeId: store.id } });

    let nextCrawl: string | null = null;
    if (store.lastCrawl) {
      nextCrawl = new Date(store.lastCrawl.getTime() + 6 * 60 * 60 * 1000).toISOString();
    }

    return NextResponse.json({
      success: true,
      data: {
        status: store.crawlStatus || "idle",
        lastCrawl: store.lastCrawl?.toISOString() || null,
        pagesCrawled: crawlInfo.pages?.length || 0,
        productsFound: totalProducts,
        productsSynced: activeProducts,
        faqsFound: crawlInfo.faqs?.length || 0,
        totalConversations,
        nextCrawl,
        websiteUrl: store.url || store.websiteUrl || null,
        ownershipVerified: store.ownershipVerified,
      },
    }, { headers: corsHeaders });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    console.error("Sync status error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
