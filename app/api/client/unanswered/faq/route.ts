import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true, crawlData: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const body = await request.json();
    const question = body.question as string;
    if (!question) return NextResponse.json({ success: false, error: "Question is required" }, { status: 400 });

    let crawl: any = {};
    if (store.crawlData) { try { crawl = JSON.parse(store.crawlData); } catch {} }
    const unanswered: any[] = crawl.unanswered || [];
    const idx = unanswered.findIndex((u: any) => u.question === question);
    if (idx !== -1) unanswered.splice(idx, 1);
    crawl.unanswered = unanswered;
    if (!crawl.faqs) crawl.faqs = [];
    crawl.faqs.push({ question, answer: "", addedAt: new Date().toISOString() });
    await prisma.store.update({ where: { id: store.id }, data: { crawlData: JSON.stringify(crawl) } });
    return NextResponse.json({ success: true, data: crawl.faqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
