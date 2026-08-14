import { META_GRAPH_URL } from "./types";
import prisma from "@/lib/db";
import { processChannelMessage } from "./processor";

export async function sendMessengerText(
  accessToken: string,
  pageId: string,
  recipientId: string,
  text: string
): Promise<any> {
  const res = await fetch(`${META_GRAPH_URL}/me/messages?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Messenger send failed: ${err}`);
  }

  return res.json();
}

export async function handleMessengerIncoming(payload: any): Promise<void> {
  const entry = payload.entry?.[0];
  const messaging = entry?.messaging?.[0];
  if (!messaging?.message?.text) return;

  const senderId = messaging.sender?.id;
  const text = messaging.message.text;
  const pageId = entry.id;

  const channel = await prisma.channel.findFirst({
    where: { type: "messenger", credentials: { contains: pageId } },
  });
  if (!channel) return;

  const storeId = channel.storeId;
  const sessionId = `msgr_${senderId}`;

  const existing = await prisma.conversation.findFirst({
    where: { sessionId },
  });

  if (existing) {
    const msgs = JSON.parse(existing.messages || "[]");
    msgs.push({ role: "user", content: text, timestamp: new Date().toISOString(), source: "messenger" });
    await prisma.conversation.update({ where: { id: existing.id }, data: { messages: JSON.stringify(msgs) } });
  } else {
    await prisma.conversation.create({
      data: {
        storeId,
        sessionId,
        customerName: senderId,
        customerEmail: `msgr_${senderId}`,
        messages: JSON.stringify([{ role: "user", content: text, timestamp: new Date().toISOString(), source: "messenger" }]),
      },
    });
  }

  await processChannelMessage({
    channelType: "messenger",
    storeId,
    customerId: senderId,
    text,
    sessionId,
    channelCredentials: channel.credentials || "{}",
  });
}
