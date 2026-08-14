import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: true, data: { products: [], totalProducts: 0, indexedCount: 0, errorCount: 0 } });

    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
    });

    const totalProducts = products.length;
    const indexedCount = products.filter(p => p.isActive).length;
    const errorCount = totalProducts - indexedCount;

    return NextResponse.json({ success: true, data: { products, totalProducts, indexedCount, errorCount } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 });

    const body = await request.json();
    const { name, price, description, category, stock, currency, image } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name,
        price: parseFloat(price),
        description: description || null,
        category: category || null,
        stock: stock ? parseInt(stock) : null,
        currency: currency || "USD",
        image: image || null,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
