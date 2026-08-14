import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET: List FAQs for current workspace
export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: true, data: [] });

    // Parse existing crawlData for FAQs
    let faqs: { question: string; answer: string }[] = [];
    if (store.crawlData) {
      try {
        const parsed = JSON.parse(store.crawlData);
        faqs = parsed.faqs || [];
      } catch {}
    }

    return NextResponse.json({ success: true, data: faqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add FAQ to workspace knowledge base
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { question, answer } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
    }

    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

    // Parse existing crawlData, add FAQ, save back
    let crawlData: any = {};
    if (store.crawlData) {
      try { crawlData = JSON.parse(store.crawlData); } catch {}
    }
    if (!crawlData.faqs) crawlData.faqs = [];
    crawlData.faqs.push({ question, answer });

    await prisma.store.update({
      where: { id: store.id },
      data: { crawlData: JSON.stringify(crawlData) },
    });

    return NextResponse.json({ success: true, data: crawlData.faqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove FAQ by index
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { index } = await request.json();

    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

    let crawlData: any = {};
    if (store.crawlData) {
      try { crawlData = JSON.parse(store.crawlData); } catch {}
    }
    if (crawlData.faqs && crawlData.faqs.length > index) {
      crawlData.faqs.splice(index, 1);
    }

    await prisma.store.update({
      where: { id: store.id },
      data: { crawlData: JSON.stringify(crawlData) },
    });

    return NextResponse.json({ success: true, data: crawlData.faqs || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
