import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { exchangeCodeForToken } from "@/lib/channels/oauth";
import { getPhoneNumberId } from "@/lib/channels/whatsapp";
import { getIgProfile } from "@/lib/channels/instagram";

const BASE = process.env.NEXT_PUBLIC_URL || "https://ai.circucity.com";

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

    const creds = await exchangeCodeForToken(code, platform);

    const extra: Record<string, string> = {};
    if (platform === "whatsapp") {
      try {
        extra.phoneNumberId = await getPhoneNumberId(creds.accessToken!);
      } catch (e: any) {
        extra.error = `Could not get WhatsApp phone number: ${e.message}`;
      }
    } else if (platform === "instagram") {
      // igUserId was never populated before, so processor.ts silently skipped every
      // outbound Instagram reply. It is also the key the webhook matches a DM on.
      try {
        const profile = await getIgProfile(creds.accessToken!);
        if (!profile.id) throw new Error("Instagram returned no user id");
        extra.igUserId = profile.id;
        if (profile.username) extra.igUserName = profile.username;
      } catch (e: any) {
        extra.error = `Could not get Instagram account: ${e.message}`;
      }
    }

    const prevChannel = await prisma.channel.findUnique({
      where: { storeId_type: { storeId: store.id, type: platform } },
    });

    if (prevChannel) {
      await prisma.channel.update({
        where: { id: prevChannel.id },
        data: {
          status: extra.error ? "error" : "connected",
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
          status: extra.error ? "error" : "connected",
          errorMessage: extra.error || null,
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

