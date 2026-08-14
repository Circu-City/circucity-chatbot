import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const storeId = searchParams.get("storeId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400, headers: corsHeaders });
  }

  const items = await prisma.cartItem.findMany({
    where: { sessionId, ...(storeId ? { storeId } : {}) },
    orderBy: { createdAt: "asc" },
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return NextResponse.json({ items, total, count }, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, sessionId, productId, name, price, currency, image, url, weight, quantity } = body;

    if (!storeId || !sessionId || !productId || !name || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: storeId, sessionId, productId, name, price" },
        { status: 400, headers: corsHeaders },
      );
    }

    const item = await prisma.cartItem.upsert({
      where: { sessionId_productId: { sessionId, productId } },
      update: { quantity: { increment: quantity || 1 } },
      create: {
        storeId,
        sessionId,
        productId,
        name,
        price,
        currency: currency || "SEK",
        image,
        url,
        weight: weight || null,
        quantity: quantity || 1,
      },
    });

    const allItems = await prisma.cartItem.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    const total = allItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = allItems.reduce((sum, i) => sum + i.quantity, 0);

    return NextResponse.json({ item, items: allItems, total, count }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Cart add error:", err);
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const productId = searchParams.get("productId");
  const clearAll = searchParams.get("clear") === "true";

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400, headers: corsHeaders });
  }

  if (clearAll) {
    await prisma.cartItem.deleteMany({ where: { sessionId } });
    return NextResponse.json({ success: true, message: "Cart cleared" }, { headers: corsHeaders });
  }

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400, headers: corsHeaders });
  }

  await prisma.cartItem.deleteMany({ where: { sessionId, productId } });

  const remaining = await prisma.cartItem.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, items: remaining }, { headers: corsHeaders });
}