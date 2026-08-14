import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getOAuthUrl, isConfigured } from "@/lib/channels/oauth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const { platform } = await req.json();
    if (!["whatsapp", "messenger", "instagram"].includes(platform)) {
      return NextResponse.json({ success: false, error: "Invalid platform" }, { status: 400 });
    }

    const configured = await isConfigured();
    if (!configured) {
      const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
      return NextResponse.json({
        success: false,
        error: "Meta App not configured",
        needsConfig: true,
        hasDbConfig: !!(settings?.metaAppId || process.env.META_APP_ID),
      }, { status: 400 });
    }

    const url = await getOAuthUrl(platform, store.id);
    return NextResponse.json({ success: true, data: { url } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

