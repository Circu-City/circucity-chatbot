import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getAuthorizationUrl, isPlatformConfigured, PLATFORMS } from "@/lib/integrations/registry";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!store) return NextResponse.json({ success: true, data: [] });

    const channels = await prisma.channel.findMany({
      where: { storeId: store.id, status: "connected" },
      select: { type: true },
    });
    const connectedPlatforms = channels.map(c => c.type);

    // Also check which OAuth platforms have credentials configured
    const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    let dbCreds: Record<string, { clientId: string; clientSecret: string }> = {};
    if (settings?.platformCredentials) {
      try { dbCreds = JSON.parse(settings.platformCredentials); } catch {}
    }

    const configuredPlatforms = Object.keys(PLATFORMS).filter(p => isPlatformConfigured(p, dbCreds[p] || null));

    return NextResponse.json({ success: true, data: { connected: connectedPlatforms, configured: configuredPlatforms } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      select: { id: true },
    });
    if (!store) {
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404 });
    }

    const body = await req.json();
    const { platform, shopDomain, returnTo } = body;

    if (!platform) {
      return NextResponse.json({ success: false, error: "Platform is required" }, { status: 400 });
    }

    const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    let dbCreds: { clientId: string; clientSecret: string } | null = null;
    if (settings?.platformCredentials) {
      try {
        const all = JSON.parse(settings.platformCredentials);
        if (all[platform]?.clientId && all[platform]?.clientSecret) {
          dbCreds = { clientId: all[platform].clientId, clientSecret: all[platform].clientSecret };
        }
      } catch {}
    }

    if (!isPlatformConfigured(platform, dbCreds)) {
      return NextResponse.json({
        success: false,
        error: `${platform} OAuth is not configured. Please configure it in Settings first.`,
        needsConfig: true,
      }, { status: 400 });
    }

    const url = getAuthorizationUrl(platform, store.id, shopDomain, dbCreds, typeof returnTo === "string" ? returnTo : undefined);

    return NextResponse.json({ success: true, data: { url } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
