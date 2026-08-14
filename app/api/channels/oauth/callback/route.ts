import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { exchangeCodeForToken } from "@/lib/channels/oauth";
import { getPhoneNumberId } from "@/lib/channels/whatsapp";

const BASE = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");

    if (!code || !stateParam) {
      return NextResponse.redirect(new URL("/dashboard?tab=integrations&error=oauth_failed", BASE));
    }

    let state: { platform: string; storeId: string };
    try {
      state = JSON.parse(stateParam);
    } catch {
      return NextResponse.redirect(new URL("/dashboard?tab=integrations&error=invalid_state", BASE));
    }

    const { platform, storeId } = state;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return NextResponse.redirect(new URL("/dashboard?tab=integrations&error=store_not_found", BASE));
    }

    const creds = await exchangeCodeForToken(code);

    const extra: Record<string, string> = {};
    if (platform === "whatsapp") {
      try {
        extra.phoneNumberId = await getPhoneNumberId(creds.accessToken!);
      } catch (e: any) {
        extra.error = `Could not get WhatsApp phone number: ${e.message}`;
      }
    }

    const prevChannel = await prisma.channel.findUnique({
      where: { storeId_type: { storeId: store.id, type: platform } },
    });

    if (prevChannel) {
      await prisma.channel.update({
        where: { id: prevChannel.id },
        data: {
          status: "connected",
          credentials: JSON.stringify({ ...creds, ...extra }),
          errorMessage: extra.error || null,
        },
      });
    } else {
      const names: Record<string, string> = {
        whatsapp: "WhatsApp Business",
        messenger: "Facebook Messenger",
        instagram: "Instagram",
      };
      await prisma.channel.create({
        data: {
          storeId: store.id,
          type: platform,
          name: names[platform] || platform,
          status: "connected",
          credentials: JSON.stringify({ ...creds, ...extra }),
        },
      });
    }

    await prisma.channel.update({
      where: { storeId_type: { storeId: store.id, type: platform } },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.redirect(new URL("/dashboard?tab=integrations&success=connected", BASE));
  } catch (e: any) {
    console.error("OAuth callback error:", e);
    return NextResponse.redirect(new URL(`/dashboard?tab=integrations&error=${encodeURIComponent(e.message)}`, BASE));
  }
}

