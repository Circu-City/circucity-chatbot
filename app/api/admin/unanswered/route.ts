import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || undefined;

    const where = storeId ? { id: storeId } : {};
    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, businessName: true, crawlData: true },
    });

    const unanswered: any[] = [];
    for (const store of stores) {
      if (!store.crawlData) continue;
      try {
        const crawl = JSON.parse(store.crawlData);
        if (Array.isArray(crawl.unanswered)) {
          for (const q of crawl.unanswered) {
            unanswered.push({ ...q, storeName: store.businessName || store.name, storeId: store.id });
          }
        }
      } catch {}
    }

    unanswered.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ success: true, data: unanswered.slice(0, 200) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
