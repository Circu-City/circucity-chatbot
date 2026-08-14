import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_BASE = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";
const CALLBACK = `${APP_BASE}/api/listings/connectors/etsy/callback`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL(`/dashboard/listing?etsy=error_denied`, APP_BASE));
    }
    if (!code || !state) {
      return NextResponse.redirect(new URL(`/dashboard/listing?etsy=error_missing`, APP_BASE));
    }

    const apiKey = process.env.ETSY_API_KEY;
    if (!apiKey) {
      return NextResponse.redirect(new URL(`/dashboard/listing?etsy=error_not_configured`, APP_BASE));
    }

    const channel = await prisma.channel.findUnique({
      where: { storeId_type: { storeId: state, type: "etsy" } },
    });
    let codeVerifier = "";
    try {
      codeVerifier = JSON.parse(channel?.credentials || "{}").codeVerifier || "";
    } catch { /* fall through */ }
    if (!codeVerifier) {
      return NextResponse.redirect(new URL(`/dashboard/listing?etsy=error_no_session`, APP_BASE));
    }

    const tokenRes = await fetch("https://api.etsy.com/v3/public/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: apiKey,
        code,
        redirect_uri: CALLBACK,
        code_verifier: codeVerifier,
      }).toString(),
      signal: AbortSignal.timeout(20_000),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
      const msg = tokenData?.error_description || tokenData?.error || `HTTP ${tokenRes.status}`;
      return NextResponse.redirect(new URL(`/dashboard/listing?etsy=error_token`, APP_BASE));
    }

    // Resolve the shop the token belongs to.
    const shopRes = await fetch("https://openapi.etsy.com/v3/application/shops", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "x-api-key": apiKey },
      signal: AbortSignal.timeout(20_000),
    });
    const shopData = await shopRes.json().catch(() => ({}));
    const shopId = shopData?.results?.[0]?.shop_id;
    const shopName = shopData?.results?.[0]?.shop_name || "yourshop";

    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        status: "connected",
        name: `Etsy (${shopName})`,
        credentials: JSON.stringify({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : undefined,
          shopId: shopId ? String(shopId) : "",
          shopName,
        }),
        lastSyncAt: new Date(),
        errorMessage: null,
      },
    });

    return NextResponse.redirect(new URL(`/dashboard/listing?etsy=connected`, APP_BASE));
  } catch (e: any) {
    console.error("[Etsy callback]", e);
    return NextResponse.redirect(new URL(`/dashboard/listing?etsy=error`, APP_BASE));
  }
}