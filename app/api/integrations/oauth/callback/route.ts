import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { exchangeCode, PLATFORMS } from "@/lib/integrations/registry";
import { syncShopifyCatalog } from "@/lib/shopify/sync";

const APP_BASE = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

function cbRedirect(path: string) {
  return new URL(path, APP_BASE);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");
    const shop = searchParams.get("shop");

    if (error) {
      console.error("OAuth error from provider:", error);
      return NextResponse.redirect(cbRedirect("/dashboard?tab=integrations&error=oauth_denied"));
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(cbRedirect("/dashboard?tab=integrations&error=missing_params"));
    }

    let state: { platform: string; storeId: string; shop?: string; returnTo?: string };
    try {
      state = JSON.parse(stateParam);
    } catch {
      return NextResponse.redirect(cbRedirect("/dashboard?tab=integrations&error=invalid_state"));
    }

    const { platform, storeId } = state;
    const shopDomain = shop || state.shop || "";
    const returnTo = typeof state.returnTo === "string" && state.returnTo.startsWith("/") ? state.returnTo : "";

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return NextResponse.redirect(cbRedirect("/dashboard?tab=integrations&error=store_not_found"));
    }

    if (!PLATFORMS[platform]) {
      return NextResponse.redirect(cbRedirect("/dashboard?tab=integrations&error=unknown_platform"));
    }

    const cbSettings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    let cbClientId: string | undefined;
    let cbClientSecret: string | undefined;
    if (cbSettings?.platformCredentials) {
      try {
        const all = JSON.parse(cbSettings.platformCredentials);
        if (all[platform]?.clientId && all[platform]?.clientSecret) {
          cbClientId = all[platform].clientId;
          cbClientSecret = all[platform].clientSecret;
        }
      } catch {}
    }

    const creds = await exchangeCode(code, platform, shopDomain, cbClientId, cbClientSecret);

    if (platform === "shopify" && shopDomain) {
      creds.shopDomain = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    }

    const platformInfo = PLATFORMS[platform];
    const channelName = shopDomain ? `${platformInfo.name} (${shopDomain})` : platformInfo.name;
    const channelType = platform;

    const existing = await prisma.channel.findUnique({
      where: { storeId_type: { storeId: store.id, type: channelType } },
    });

    let channel;
    if (existing) {
      channel = await prisma.channel.update({
        where: { id: existing.id },
        data: {
          status: "connected",
          credentials: JSON.stringify(creds),
          lastSyncAt: new Date(),
          errorMessage: null,
        },
      });
    } else {
      channel = await prisma.channel.create({
        data: {
          storeId: store.id,
          type: channelType,
          name: channelName,
          status: "connected",
          credentials: JSON.stringify(creds),
        },
      });
    }

    if (platform === "shopify") {
      setTimeout(() => {
        syncShopifyCatalog(store.id, channel)
          .then((summary) => {
            console.log("[Shopify] Auto-sync after install completed for", channelName, JSON.stringify(summary).slice(0, 300));
          })
          .catch((e) => {
            console.error("[Shopify] Auto-sync after install failed:", e.message);
          });
      }, 50);
    }

    const fallback = "/dashboard?tab=integrations&success=connected";
    return NextResponse.redirect(cbRedirect(`${returnTo || fallback}${returnTo ? "?connected=1" : ""}`));
  } catch (e: any) {
    console.error("OAuth callback error:", e);
    const msg = (e && e.message ? e.message : String(e)).replace(/\s+/g, " ").slice(0, 200);
    return NextResponse.redirect(cbRedirect(`/dashboard?tab=integrations&error=${encodeURIComponent(msg)}`));
  }
}