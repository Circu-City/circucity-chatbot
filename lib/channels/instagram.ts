import { IG_GRAPH_URL, IG_API_VERSION, getChannelConfigFromDb } from "./types";
import prisma from "@/lib/db";
import { processChannelMessage } from "./processor";

// Instagram API with Instagram Login.
//
// The previous implementation used "Instagram API with Facebook Login": Page scopes
// (pages_messaging et al), graph.facebook.com, and a Facebook Page linked to the
// Instagram account. Meta deprecated those scope values on 2025-01-27, and the Page
// requirement was a hard onboarding step for small merchants. This flow talks to
// graph.instagram.com with instagram_business_* scopes and needs no Facebook Page.

/** The connected Instagram professional account. `me` resolves from the token itself. */
export async function getIgProfile(accessToken: string): Promise<{ id: string; username?: string }> {
  const res = await fetch(
    `${IG_GRAPH_URL}/${IG_API_VERSION}/me?fields=user_id,username&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) throw new Error(`Failed to get Instagram account: ${await res.text()}`);
  const data = await res.json();
  // Instagram Login returns `user_id` here; `id` is the app-scoped id. Messaging needs user_id.
  return { id: String(data.user_id || data.id || ""), username: data.username };
}

export async function sendIgTextMessage(
  accessToken: string,
  igUserId: string,
  to: string,
  text: string
): Promise<any> {
  const res = await fetch(`${IG_GRAPH_URL}/${IG_API_VERSION}/${igUserId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: to },
      message: { text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Instagram send failed: ${err}`);
  }

  return res.json();
}

/**
 * Long-lived Instagram tokens last 60 days. Refreshable once the token is at least
 * 24h old; a refreshed token is good for another 60 days.
 */
export async function refreshIgToken(accessToken: string): Promise<{ accessToken: string; tokenExpiresAt: string }> {
  const res = await fetch(
    `${IG_GRAPH_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) throw new Error(`Instagram token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    tokenExpiresAt: new Date(Date.now() + (data.expires_in ?? 5184000) * 1000).toISOString(),
  };
}

/** Exchange a short-lived Business Login token for a 60-day one. */
export async function exchangeIgLongLivedToken(shortToken: string): Promise<{ accessToken: string; tokenExpiresAt: string }> {
  const cfg = await getChannelConfigFromDb();
  const res = await fetch(
    `${IG_GRAPH_URL}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(
      cfg.igAppSecret
    )}&access_token=${encodeURIComponent(shortToken)}`
  );
  if (!res.ok) throw new Error(`Instagram long-lived token exchange failed: ${await res.text()}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    tokenExpiresAt: new Date(Date.now() + (data.expires_in ?? 5184000) * 1000).toISOString(),
  };
}

interface IncomingDm {
  senderId: string;
  recipientId: string;
  text: string;
  isEcho: boolean;
}

/**
 * Pull DMs out of a webhook body.
 *
 * Direct messages arrive under entry[].messaging[] (the Messenger Platform shape).
 * The previous code read entry[].changes[].value.messages, which is the comments and
 * mentions shape -- so every DM hit an early return and was silently dropped. Meta's
 * public docs don't pin the DM payload down precisely, so both shapes are parsed here
 * rather than betting on one.
 */
export function parseIgWebhook(payload: any): IncomingDm[] {
  const out: IncomingDm[] = [];

  for (const entry of payload?.entry ?? []) {
    // Primary shape: entry[].messaging[]
    for (const m of entry?.messaging ?? []) {
      const text = m?.message?.text;
      if (!text) continue; // reactions, read receipts, attachments-only
      out.push({
        senderId: String(m?.sender?.id ?? ""),
        recipientId: String(m?.recipient?.id ?? entry?.id ?? ""),
        text,
        // Echoes are our own outbound messages reflected back; replying would loop.
        isEcho: Boolean(m?.message?.is_echo),
      });
    }

    // Fallback shape: entry[].changes[].value
    for (const change of entry?.changes ?? []) {
      if (change?.field && change.field !== "messages") continue;
      const value = change?.value;
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      for (const msg of messages) {
        const text = typeof msg?.text === "string" ? msg.text : msg?.text?.body;
        if (!text) continue;
        out.push({
          senderId: String(value?.sender?.id ?? msg?.from?.id ?? ""),
          recipientId: String(value?.recipient?.id ?? entry?.id ?? ""),
          text,
          isEcho: Boolean(msg?.is_echo),
        });
      }
    }
  }

  return out.filter((m) => m.senderId && m.text && !m.isEcho);
}

export async function handleIgIncoming(payload: any): Promise<void> {
  const messages = parseIgWebhook(payload);
  if (!messages.length) return;

  for (const dm of messages) {
    // The recipient is the merchant's Instagram account, so it identifies the tenant.
    // Matching on the stored igUserId is exact; `credentials contains` was matching a
    // raw pageId substring anywhere in the JSON blob, which could collide.
    const channels = await prisma.channel.findMany({
      where: { type: "instagram", isActive: true },
    });

    const channel = channels.find((c) => {
      try {
        return JSON.parse(c.credentials || "{}").igUserId === dm.recipientId;
      } catch {
        return false;
      }
    });

    if (!channel) {
      console.warn(`[instagram] no channel for recipient ${dm.recipientId}`);
      continue;
    }

    const storeId = channel.storeId;
    const sessionId = `ig_${dm.senderId}`;

    const existing = await prisma.conversation.findFirst({ where: { sessionId } });
    const entryMsg = {
      role: "user",
      content: dm.text,
      timestamp: new Date().toISOString(),
      source: "instagram",
    };

    if (existing) {
      const msgs = JSON.parse(existing.messages || "[]");
      msgs.push(entryMsg);
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { messages: JSON.stringify(msgs) },
      });
    } else {
      await prisma.conversation.create({
        data: {
          storeId,
          sessionId,
          customerName: `IG:${dm.senderId}`,
          customerEmail: `ig_${dm.senderId}`,
          messages: JSON.stringify([entryMsg]),
        },
      });
    }

    await processChannelMessage({
      channelType: "instagram",
      storeId,
      customerId: dm.senderId,
      customerName: `IG:${dm.senderId}`,
      text: dm.text,
      sessionId,
      channelCredentials: channel.credentials || "{}",
    });
  }
}
