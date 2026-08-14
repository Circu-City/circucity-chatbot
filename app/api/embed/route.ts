import { NextResponse } from "next/server";
import { embedStoreProducts } from "@/lib/product-search";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { storeId } = await req.json();
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: session.id },
    });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const count = await embedStoreProducts(storeId);
    return NextResponse.json({ success: true, embedded: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAuth();
    const { storeId, chunks } = await req.json();
    if (!storeId || !chunks) return NextResponse.json({ error: "storeId and chunks required" }, { status: 400 });

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: session.id },
    });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { indexDocumentChunks } = await import("@/lib/rag");
    const count = await indexDocumentChunks(storeId, "api", chunks);
    return NextResponse.json({ success: true, indexed: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
