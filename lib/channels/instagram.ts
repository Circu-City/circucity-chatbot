import { META_GRAPH_URL } from "./types";
import prisma from "@/lib/db";
import { processChannelMessage } from "./processor";

export async function getIgUserId(accessToken: string, pageId: string): Promise<string> {
  const res = await fetch(`${META_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
  if (!res.ok) throw new Error("Failed to get Instagram account");
  const data = await res.json();
  return data.instagram_business_account?.id || "";
}

export async function sendIgTextMessage(
  accessToken: string,
  igUserId: string,
  to: string,
  text: string
): Promise<any> {
  const res = await fetch(`${META_GRAPH_URL}/${igUserId}/messages`, {
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

export async function handleIgIncoming(payload: any): Promise<void> {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messages = value?.messages;

  if (!messages) return;

  const senderId = value?.sender?.id;
  const text = messages[0]?.text || "";
  const pageId = value?.metadata?.page_id;

  const channel = await prisma.channel.findFirst({
    where: { type: "instagram", credentials: { contains: pageId } },
  });
  if (!channel) return;

  const storeId = channel.storeId;
  const sessionId = `ig_${senderId}`;

  const existing = await prisma.conversation.findFirst({
    where: { sessionId },
  });

  if (existing) {
    const msgs = JSON.parse(existing.messages || "[]");
    msgs.push({ role: "user", content: text, timestamp: new Date().toISOString(), source: "instagram" });
    await prisma.conversation.update({ where: { id: existing.id }, data: { messages: JSON.stringify(msgs) } });
  } else {
    await prisma.conversation.create({
      data: {
        storeId,
        sessionId,
        customerName: `IG:${senderId}`,
        customerEmail: `ig_${senderId}`,
        messages: JSON.stringify([{ role: "user", content: text, timestamp: new Date().toISOString(), source: "instagram" }]),
      },
    });
  }

  await processChannelMessage({
    channelType: "instagram",
    storeId,
    customerId: senderId,
    customerName: `IG:${senderId}`,
    text,
    sessionId,
    channelCredentials: channel.credentials || "{}",
  });
}
