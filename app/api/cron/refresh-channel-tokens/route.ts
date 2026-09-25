import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { refreshIgToken } from "@/lib/channels/instagram";
import { META_GRAPH_URL, getChannelConfigFromDb } from "@/lib/channels/types";

export const dynamic = "force-dynamic";

const CRON_API_KEY = process.env.CRON_API_KEY || "circucity-cron-key-2024";

// Meta long-lived tokens last 60 days and nothing renewed them, so every connected
// channel quietly died two months after it was authorised -- while the dashboard kept
// showing "connected" because status was only ever written at connect time.
//
// Refresh anything expiring within this window, and mark what can't be refreshed as
// "error" so a dead channel actually looks dead to the merchant.
const REFRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Facebook long-lived tokens are extended by re-exchanging them. */
async function refreshFacebookToken(accessToken: string): Promise<{ accessToken: string; tokenExpiresAt: string }> {
  const cfg = await getChannelConfigFromDb();
  const res = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: cfg.appId,
        client_secret: cfg.appSecret,
        fb_exchange_token: accessToken,
      })
  );
  if (!res.ok) throw new Error(`Facebook token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    // Page tokens can come back without expires_in, meaning long-lived; treat as 60d.
    tokenExpiresAt: new Date(Date.now() + (data.expires_in ?? 5184000) * 1000).toISOString(),
  };
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("key") !== CRON_API_KEY) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const channels = await prisma.channel.findMany({
    where: { type: { in: ["instagram", "messenger", "whatsapp"] }, isActive: true },
  });

  const results: Array<Record<string, unknown>> = [];
  const now = Date.now();

  for (const channel of channels) {
    let creds: Record<string, any>;
    try {
      creds = JSON.parse(channel.credentials || "{}");
    } catch {
      results.push({ id: channel.id, type: channel.type, action: "skipped", reason: "unparseable credentials" });
      continue;
    }

    if (!creds.accessToken) {
      results.push({ id: channel.id, type: channel.type, action: "skipped", reason: "no token" });
      continue;
    }

    const expiresAt = creds.tokenExpiresAt ? Date.parse(creds.tokenExpiresAt) : NaN;

    // No recorded expiry means the channel predates expiry tracking; refresh it once
    // so it gets a real date rather than leaving it to fail silently.
    const needsRefresh = Number.isNaN(expiresAt) || expiresAt - now < REFRESH_WINDOW_MS;
    if (!needsRefresh) {
      results.push({ id: channel.id, type: channel.type, action: "ok", expiresAt: creds.tokenExpiresAt });
      continue;
    }

    const alreadyExpired = !Number.isNaN(expiresAt) && expiresAt < now;

    try {
      const refreshed =
        channel.type === "instagram"
          ? await refreshIgToken(creds.accessToken)
          : await refreshFacebookToken(creds.accessToken);

      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          credentials: JSON.stringify({ ...creds, ...refreshed }),
          status: "connected",
          errorMessage: null,
          lastSyncAt: new Date(),
        },
      });
      results.push({ id: channel.id, type: channel.type, action: "refreshed", expiresAt: refreshed.tokenExpiresAt });
    } catch (e: any) {
      // An expired token can't be refreshed -- the merchant has to reconnect. Say so
      // plainly in the dashboard instead of leaving a green "connected" badge.
      const message = alreadyExpired
        ? "Connection expired. Please reconnect this channel."
        : `Token refresh failed: ${e.message}`;
      await prisma.channel.update({
        where: { id: channel.id },
        data: { status: "error", errorMessage: message },
      });
      results.push({ id: channel.id, type: channel.type, action: "failed", error: message });
    }
  }

  const summary = results.reduce<Record<string, number>>((acc, r) => {
    const k = String(r.action);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ success: true, checked: channels.length, summary, results });
}
