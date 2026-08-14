import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PLATFORMS } from "@/lib/integrations/registry";

export async function GET() {
  try {
    await requireAdmin();
    let settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: { id: "singleton" } });
    }

    let credentials: Record<string, any> = {};
    try {
      credentials = JSON.parse(settings.platformCredentials || "{}");
    } catch {}

    // Build response with env status for each platform
    const platforms: Record<string, any> = {};
    for (const [id, platform] of Object.entries(PLATFORMS)) {
      const saved = credentials[id] || {};
      const envDefined = !!process.env[platform.clientIdEnv] && !!process.env[platform.clientSecretEnv];
      platforms[id] = {
        id: platform.id,
        name: platform.name,
        category: platform.category,
        clientId: saved.clientId || "",
        clientSecret: saved.clientSecret ? "••••••••" : "",
        clientIdEnv: platform.clientIdEnv,
        clientSecretEnv: platform.clientSecretEnv,
        envDefined,
        scopes: platform.scopes,
      };
    }

    return NextResponse.json({ success: true, data: platforms });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { platformId, clientId, clientSecret } = body;

    if (!platformId || !PLATFORMS[platformId]) {
      return NextResponse.json({ success: false, error: "Invalid platform" }, { status: 400 });
    }

    let settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: { id: "singleton" } });
    }

    let credentials: Record<string, any> = {};
    try {
      credentials = JSON.parse(settings.platformCredentials || "{}");
    } catch {}

    credentials[platformId] = { clientId, clientSecret };

    await prisma.platformSettings.update({
      where: { id: "singleton" },
      data: { platformCredentials: JSON.stringify(credentials) },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
