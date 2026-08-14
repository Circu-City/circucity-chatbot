import { META_GRAPH_URL } from "./types";
import prisma from "@/lib/db";
import { processChannelMessage } from "./processor";

export async function getPhoneNumberId(accessToken: string): Promise<string> {
  const res = await fetch(`${META_GRAPH_URL}/me/whatsapp_business_accounts?access_token=${accessToken}`);
  if (!res.ok) throw new Error("Failed to get WhatsApp Business Account");
  const data = await res.json();
  const wabaId = data.data?.[0]?.id;
  if (!wabaId) throw new Error("No WhatsApp Business Account found");

  const phoneRes = await fetch(`${META_GRAPH_URL}/${wabaId}?fields=phone_numbers&access_token=${accessToken}`);
  if (!phoneRes.ok) throw new Error("Failed to get phone numbers");
  const phoneData = await phoneRes.json();
  return phoneData.phone_numbers?.data?.[0]?.id || "";
}

export async function sendTextMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  text: string
): Promise<any> {
  const res = await fetch(`${META_GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${err}`);
  }

  return res.json();
}

export async function sendTemplateMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  templateName: string,
  language: string = "en"
): Promise<any> {
  const res = await fetch(`${META_GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: { name: templateName, language: { code: language } },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp template send failed: ${err}`);
  }

  return res.json();
}

export async function handleIncomingMessage(payload: any): Promise<void> {
  const entry = payload.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messages = value?.messages;
  const phoneNumberId = value?.metadata?.phone_number_id;

  if (!messages || !phoneNumberId) return;

  const channel = await prisma.channel.findFirst({
    where: { type: "whatsapp", credentials: { contains: phoneNumberId } },
  });
  if (!channel?.storeId) return;

  const storeId = channel.storeId;

  for (const msg of messages) {
    const from = msg.from;
    const text = msg.text?.body || "";
    const msgId = msg.id;
    const sessionId = `wa_${from}`;

    const existing = await prisma.conversation.findFirst({
      where: { sessionId },
    });

    if (existing) {
      const msgs = JSON.parse(existing.messages || "[]");
      msgs.push({ role: "user", content: text, timestamp: new Date().toISOString(), source: "whatsapp" });
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { messages: JSON.stringify(msgs), updatedAt: new Date() },
      });
    } else {
      await prisma.conversation.create({
        data: {
          storeId,
          sessionId,
          customerName: from,
          customerEmail: from,
          messages: JSON.stringify([{ role: "user", content: text, timestamp: new Date().toISOString(), source: "whatsapp" }]),
        },
      });
    }

    await processChannelMessage({
      channelType: "whatsapp",
      storeId,
      customerId: from,
      text,
      sessionId,
      channelCredentials: channel.credentials || "{}",
    });
  }
}
