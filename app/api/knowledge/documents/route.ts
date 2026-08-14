import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET: List documents/entries for current workspace
export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: true, data: [] });

    let documents: { name: string; content: string; addedAt: string }[] = [];
    if (store.crawlData) {
      try {
        const parsed = JSON.parse(store.crawlData);
        documents = parsed.documents || [];
      } catch {}
    }

    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add a knowledge document (text content)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { name, content } = await request.json();

    if (!name || !content) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ error: "No workspace found" }, { status: 404 });

    let crawlData: any = {};
    if (store.crawlData) {
      try { crawlData = JSON.parse(store.crawlData); } catch {}
    }
    if (!crawlData.documents) crawlData.documents = [];
    crawlData.documents.push({ name, content, addedAt: new Date().toISOString() });

    await prisma.store.update({
      where: { id: store.id },
      data: { crawlData: JSON.stringify(crawlData) },
    });

    return NextResponse.json({ success: true, data: crawlData.documents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove document by index
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
    if (crawlData.documents && crawlData.documents.length > index) {
      crawlData.documents.splice(index, 1);
    }

    await prisma.store.update({
      where: { id: store.id },
      data: { crawlData: JSON.stringify(crawlData) },
    });

    return NextResponse.json({ success: true, data: crawlData.documents || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
