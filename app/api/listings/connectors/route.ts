import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { assertCanPublish, getEffectivePlan, getListingQuota } from "@/lib/listing";
import { verifyWooCredentials } from "@/lib/listing-connectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configured(envKey: string, second?: string): boolean {
  return Boolean((second ? process.env[envKey] && process.env[second] : process.env[envKey]));
}

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const [channels, records, quota] = await Promise.all([
      prisma.channel.findMany({
        where: { storeId: store.id },
        select: { id: true, type: true, name: true, status: true, lastSyncAt: true, errorMessage: true, settings: true },
      }),
      prisma.listingRecord.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, title: true, platform: true, status: true, remoteId: true, remoteUrl: true, createdAt: true },
      }),
      getListingQuota(session.id),
    ]);

    const connected = channels.filter((c) => c.status === "connected").map((c) => c.type);

    let webhookUrl: string | null = null;
    const hookChannel = channels.find((c) => c.type === "webhook" && c.status === "connected");
    if (hookChannel?.settings) {
      try {
        webhookUrl = JSON.parse(hookChannel.settings)?.url || null;
      } catch { /* no url */ }
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: quota.plan,
        quota,
        canPublish: await assertCanPublish(session.id).then(() => true).catch(() => false),
        connected,
        channels: channels.map((c) => ({
          type: c.type,
          name: c.name,
          status: c.status,
          lastSyncAt: c.lastSyncAt,
          errorMessage: c.errorMessage,
        })),
        webhookUrl,
        configured: {
          shopify: configured("SHOPIFY_OAUTH_CLIENT_ID", "SHOPIFY_OAUTH_CLIENT_SECRET"),
          woocommerce: true,
          ebay: configured("EBAY_OAUTH_APP_ID", "EBAY_OAUTH_CERT_ID"),
          etsy: configured("ETSY_API_KEY"),
          webhook: true,
        },
        history: records,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unauthorized" }, { status: 401 });
  }
}

const wooSchema = z.object({
  type: z.literal("woocommerce"),
  shopUrl: z.string().url(),
  consumerKey: z.string().min(1),
  consumerSecret: z.string().min(1),
});

const webhookSchema = z.object({
  type: z.literal("webhook"),
  name: z.string().min(1),
  url: z.string().url(),
  secret: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body?.type === "woocommerce") {
      const parsed = wooSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "A valid shop URL and consumer key/secret are required" }, { status: 400 });
      try {
        await verifyWooCredentials(parsed.data.shopUrl, parsed.data.consumerKey, parsed.data.consumerSecret);
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Could not verify WooCommerce credentials" }, { status: 400 });
      }
      const channel = await prisma.channel.upsert({
        where: { storeId_type: { storeId: store.id, type: "woocommerce" } },
        create: {
          storeId: store.id,
          type: "woocommerce",
          name: `WooCommerce (${parsed.data.shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")})`,
          status: "connected",
          credentials: JSON.stringify({
            shopUrl: parsed.data.shopUrl.replace(/\/+$/, ""),
            consumerKey: parsed.data.consumerKey,
            consumerSecret: parsed.data.consumerSecret,
          }),
          lastSyncAt: new Date(),
        },
        update: {
          status: "connected",
          name: `WooCommerce (${parsed.data.shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")})`,
          credentials: JSON.stringify({
            shopUrl: parsed.data.shopUrl.replace(/\/+$/, ""),
            consumerKey: parsed.data.consumerKey,
            consumerSecret: parsed.data.consumerSecret,
          }),
          lastSyncAt: new Date(),
          errorMessage: null,
        },
      });
      return NextResponse.json({ success: true, data: { type: channel.type, name: channel.name, status: channel.status } });
    }

    if (body?.type === "webhook") {
      const parsed = webhookSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "A URL and name are required for the webhook" }, { status: 400 });
      const channel = await prisma.channel.upsert({
        where: { storeId_type: { storeId: store.id, type: "webhook" } },
        create: {
          storeId: store.id,
          type: "webhook",
          name: parsed.data.name,
          status: "connected",
          settings: JSON.stringify({ url: parsed.data.url, secret: parsed.data.secret || "" }),
          lastSyncAt: new Date(),
        },
        update: {
          name: parsed.data.name,
          status: "connected",
          settings: JSON.stringify({ url: parsed.data.url, secret: parsed.data.secret || "" }),
          lastSyncAt: new Date(),
          errorMessage: null,
        },
      });
      return NextResponse.json({ success: true, data: { type: channel.type, name: channel.name, status: channel.status } });
    }

    return NextResponse.json({ error: "Unsupported connector type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save connector" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type } = body || {};
    if (!type) return NextResponse.json({ error: "Connector type is required" }, { status: 400 });

    await prisma.channel.deleteMany({ where: { storeId: store.id, type } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to disconnect" }, { status: 500 });
  }
}