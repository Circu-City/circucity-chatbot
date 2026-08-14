import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404, headers: corsHeaders });
    }

    const body = await request.json();
    const { products, replaceAll } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Products array is required" }, { status: 400, headers: corsHeaders });
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const item of products) {
      try {
        if (!item.name || item.price === undefined) {
          results.skipped++;
          continue;
        }

        const existing = item.slug
          ? await prisma.product.findFirst({
              where: { storeId: store.id, slug: item.slug },
            })
          : null;

        const data = {
          storeId: store.id,
          name: item.name,
          price: parseFloat(item.price),
          description: item.description || null,
          category: item.category || null,
          stock: item.stock ? parseInt(item.stock) : null,
          currency: item.currency || "USD",
          image: item.image || null,
          url: item.url || null,
          slug: item.slug || null,
          isActive: true,
        };

        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data });
          results.updated++;
        } else {
          await prisma.product.create({ data });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Failed to sync "${item.name || "unknown"}": ${err.message}`);
      }
    }

    // If replaceAll, deactivate products not in the incoming list
    if (replaceAll) {
      const incomingSlugs = products.filter((p: any) => p.slug).map((p: any) => p.slug);
      if (incomingSlugs.length > 0) {
        await prisma.product.updateMany({
          where: {
            storeId: store.id,
            isActive: true,
            slug: { notIn: incomingSlugs },
          },
          data: { isActive: false },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401, headers: corsHeaders });
  }
}
