import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";
import { checkWidgetOrigin, originForbiddenResponseBody } from "@/lib/widget-api";

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin || "https://chatbot.circucity.com";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, If-None-Match",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("apiKey") || searchParams.get("storeId");
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing apiKey or storeId" },
      { status: 400, headers: getCorsHeaders(originHeader) }
    );
  }

  try {
    const store = await prisma.store.findFirst({
      where: {
        OR: [{ apiKey }, { id: apiKey }],
        status: "active",
      },
      include: {
        embedSettings: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or inactive" },
        { status: 404, headers: getCorsHeaders(originHeader) }
      );
    }

    // Domain Authorization check
    const originDecision = checkWidgetOrigin(store, originHeader, refererHeader);
    if (!originDecision.allowed) {
      return NextResponse.json(originForbiddenResponseBody(originDecision.host), {
        status: 403,
        headers: getCorsHeaders(originHeader),
      });
    }

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        category: true,
        image: true,
        url: true,
        description: true,
        stock: true,
      },
      take: 200,
      orderBy: { updatedAt: "desc" },
    });

    let crawl: any = null;
    if (store.crawlData) {
      try {
        crawl = JSON.parse(store.crawlData);
      } catch {
        crawl = null;
      }
    }

    const manifest = {
      storeId: store.id,
      storeName: store.businessName || store.name || "Store",
      botName: store.embedSettings?.botName || "Gavriel",
      currency: products[0]?.currency || "USD",
      products: products.map((p) => ({
        id: p.id,
        n: p.name,
        p: p.price,
        c: p.currency || "USD",
        cat: p.category || "General",
        img: p.image,
        u: p.url,
        d: p.description ? p.description.slice(0, 160) : "",
        s: p.stock ?? 10,
      })),
      faqs: (crawl?.faqs || []).slice(0, 10).map((f: any) => ({
        q: f.question,
        a: f.answer,
      })),
      policies: {
        shipping: store.shippingInfo || null,
        returns: store.returnPolicy || null,
        hours: store.operatingHours || null,
      },
      updatedAt: store.updatedAt.toISOString(),
    };

    const manifestJson = JSON.stringify(manifest);
    const etag = `"${crypto.createHash("md5").update(manifestJson).digest("hex")}"`;

    const clientEtag = request.headers.get("if-none-match");
    if (clientEtag && clientEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ...getCorsHeaders(originHeader),
          ETag: etag,
          "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        },
      });
    }

    return new NextResponse(manifestJson, {
      status: 200,
      headers: {
        ...getCorsHeaders(originHeader),
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("Manifest generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getCorsHeaders(originHeader) }
    );
  }
}
