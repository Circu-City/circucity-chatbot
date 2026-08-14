import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { assertCanPublish } from "@/lib/listing";
import { publishListing } from "@/lib/listing-connectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  listingId: z.string().min(1),
  platform: z.enum(["shopify", "woocommerce", "ebay", "etsy", "webhook"]),
  images: z.array(z.string()).max(4).optional().default([]),
  target: z.object({
    webhookUrl: z.string().optional(),
    webhookSecret: z.string().optional(),
  }).optional().default({}),
});

function parseListing(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Stored listing could not be read; delete it and re-analyse the photo.");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    await assertCanPublish(session.id);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });

    const record = await prisma.listingRecord.findFirst({
      where: { id: parsed.data.listingId, userId: session.id },
    });
    if (!record) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // Webhook publishes fall back to the saved endpoint when the request
    // doesn't carry one (the saved channel is the source of truth).
    let target = parsed.data.target;
    if (parsed.data.platform === "webhook" && !target?.webhookUrl) {
      const hookChannel = await prisma.channel.findUnique({
        where: { storeId_type: { storeId: store.id, type: "webhook" } },
      });
      if (hookChannel?.settings) {
        try {
          const settings = JSON.parse(hookChannel.settings);
          if (settings?.url) target = { webhookUrl: settings.url, webhookSecret: settings.secret || "" };
        } catch { /* keep request target */ }
      }
    }

    const raw = parseListing(record.listingJson);
    const listing = {
      title: String(raw.title || record.title),
      description: String(raw.description || ""),
      category: String(raw.category || "General"),
      condition: String(raw.condition || "good"),
      priceSek: Number(raw.suggested_price_sek) || 0,
      estimatedAge: String(raw.estimated_age || "Unknown"),
      estimatedWeightKg: Number(raw.estimated_weight_kg) || 0.5,
      quantity: Math.max(1, Number(raw.quantity) || 1),
      attributes: raw.attributes && typeof raw.attributes === "object" ? raw.attributes : {},
      tags: Array.isArray(raw.attributes) ? [] : Object.values(raw.attributes).filter((v) => typeof v === "string").map(String),
    };

    const result = await publishListing(parsed.data.platform, store.id, listing, parsed.data.images, target);

    const updated = await prisma.listingRecord.update({
      where: { id: record.id },
      data: {
        platform: parsed.data.platform,
        status: "published",
        remoteId: result.remoteId ?? null,
        remoteUrl: result.remoteUrl ?? null,
        error: null,
      },
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (e: any) {
    const status = e?.message === "Unauthorized" ? 401 : typeof e?.status === "number" ? e.status : 500;
    return NextResponse.json({ error: e?.message || "Publish failed" }, { status });
  }
}