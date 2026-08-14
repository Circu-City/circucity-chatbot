import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    let settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.platformSettings.create({ data: { id: "singleton" } });
    }
    return NextResponse.json({
      success: true,
      data: {
        metaAppId: settings.metaAppId || "",
        metaAppSecret: settings.metaAppSecret ? "????????????????????????" : "",
        metaWebhookToken: settings.metaWebhookToken || "",
        envAppId: !!process.env.META_APP_ID,
        envAppSecret: !!process.env.META_APP_SECRET,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { metaAppId, metaAppSecret, metaWebhookToken } = await req.json();
    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", metaAppId, metaAppSecret, metaWebhookToken },
      update: { metaAppId, metaAppSecret, metaWebhookToken },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

