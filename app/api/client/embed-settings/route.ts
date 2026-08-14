import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      include: { embedSettings: true },
    });
    return NextResponse.json({ success: true, data: store?.embedSettings || null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const body = await request.json();
    const { primaryColor, botName, position, voiceEnabled, proactiveEnabled, showBranding, autoOpen, autoOpenDelay } = body;

    const updateData: any = {};
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (botName !== undefined) updateData.botName = botName;
    if (position !== undefined) updateData.position = position;
    if (voiceEnabled !== undefined) updateData.voiceEnabled = voiceEnabled;
    if (proactiveEnabled !== undefined) updateData.proactiveEnabled = proactiveEnabled;
    if (showBranding !== undefined) {
      if (showBranding === false && (store.plan === "free" || !store.plan)) {
        return NextResponse.json({ success: false, error: "Branding is required on the Free plan. Upgrade to remove." }, { status: 403 });
      }
      updateData.showBranding = showBranding;
    }
    if (autoOpen !== undefined) updateData.autoOpen = autoOpen;
    if (autoOpenDelay !== undefined) updateData.autoOpenDelay = autoOpenDelay;

    const updated = await prisma.embedSettings.upsert({
      where: { storeId: store.id },
      update: updateData,
      create: {
        storeId: store.id,
        ...updateData,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
