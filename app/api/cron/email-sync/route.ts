import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const Imap = require("imap");
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");

const CHAT_ENDPOINT = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";
const CRON_API_KEY = process.env.CRON_API_KEY || "circucity-cron-key-2024";

function connectImap(config: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.user,
      password: config.pass,
      host: config.host,
      port: config.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });
    imap.once("ready", () => resolve(imap));
    imap.once("error", (err: any) => reject(err));
    imap.connect();
  });
}

function openInbox(imap: any): Promise<any> {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err: any, box: any) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

function searchUnseen(imap: any): Promise<number[]> {
  return new Promise((resolve, reject) => {
    imap.search(["UNSEEN"], (err: any, results: number[]) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

function fetchEmails(imap: any, uids: number[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const fetch = imap.fetch(uids, { bodies: "", markSeen: true });
    const emails: any[] = [];
    fetch.on("message", (msg: any, seqno: number) => {
      const email: any = { seqno };
      msg.on("body", (stream: any) => {
        let buffer = "";
        stream.on("data", (chunk: any) => { buffer += chunk.toString("utf8"); });
        stream.on("end", () => { email.raw = buffer; });
      });
      msg.once("attributes", (attrs: any) => { email.uid = attrs.uid; });
      msg.once("end", () => { emails.push(email); });
    });
    fetch.once("error", (err: any) => reject(err));
    fetch.once("end", () => resolve(emails));
  });
}

function parseEmail(raw: string): Promise<any> {
  return simpleParser(raw);
}

async function sendReplyViaSmtp(config: any, to: string, subject: string, text: string) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  await transporter.sendMail({
    from: config.from,
    to,
    subject: `Re: ${subject}`,
    text,
  });
}

async function processEmail(storeId: string, fromEmail: string, fromName: string, subject: string, bodyText: string, emailChannel: any) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store?.apiKey) return;

  const sessionId = `email_${fromEmail}`;
  const fullMessage = `[Email from ${fromName} <${fromEmail}>]\nSubject: ${subject}\n\n${bodyText}`;

  const existing = await prisma.conversation.findFirst({ where: { sessionId } });

  if (existing) {
    const msgs = JSON.parse(existing.messages || "[]");
    msgs.push({ role: "user", content: fullMessage, timestamp: new Date().toISOString(), source: "email" });
    await prisma.conversation.update({ where: { id: existing.id }, data: { messages: JSON.stringify(msgs), updatedAt: new Date() } });
  } else {
    await prisma.conversation.create({
      data: { storeId, sessionId, customerName: fromName || fromEmail, customerEmail: fromEmail, messages: JSON.stringify([{ role: "user", content: fullMessage, timestamp: new Date().toISOString(), source: "email" }]) },
    });
  }

  try {
    const res = await fetch(`${CHAT_ENDPOINT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: bodyText, sessionId, apiKey: store.apiKey, customerName: fromName || fromEmail, customerEmail: fromEmail }),
    });

    if (res.ok) {
      const json = await res.json();
      const reply: string = json.reply;
      if (reply) {
        const conversation = await prisma.conversation.findUnique({ where: { sessionId } });
        if (conversation) {
          const msgs = JSON.parse(conversation.messages || "[]");
          msgs.push({ role: "bot", content: reply, timestamp: new Date().toISOString(), source: "email" });
          await prisma.conversation.update({ where: { id: conversation.id }, data: { messages: JSON.stringify(msgs) } });
        }

        await sendReplyViaSmtp(
          { host: emailChannel.smtpHost, port: emailChannel.smtpPort || 587, user: emailChannel.smtpUser || emailChannel.email, pass: emailChannel.smtpPass, from: emailChannel.email },
          fromEmail, subject, reply,
        );
      }
    }
  } catch (e) {
    console.error("Email AI processing error:", e);
  }
}

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get("key");
  if (apiKey !== CRON_API_KEY) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const channels = await prisma.emailChannel.findMany({ where: { verified: true } });
  const results: any[] = [];

  for (const ch of channels) {
    try {
      const imap = await connectImap({ host: ch.imapHost, port: ch.imapPort || 993, user: ch.imapUser || ch.email, pass: ch.imapPass });
      await openInbox(imap);
      const uids = await searchUnseen(imap);

      let count = 0;
      if (uids.length > 0) {
        const emails = await fetchEmails(imap, uids.slice(0, 20));
        for (const email of emails) {
          try {
            const parsed = await parseEmail(email.raw);
            const fromEmail = parsed.from?.value?.[0]?.address;
            const bodyText = parsed.text || parsed.html || "";
            if (fromEmail && bodyText && fromEmail !== ch.email) {
              await processEmail(ch.storeId, fromEmail, parsed.from?.value?.[0]?.name || fromEmail, parsed.subject || "(No subject)", bodyText.substring(0, 10000), ch);
              count++;
            }
          } catch {}
        }
      }

      await prisma.emailChannel.update({ where: { storeId: ch.storeId }, data: { lastSyncAt: new Date() } });
      imap.end();
      results.push({ storeId: ch.storeId, email: ch.email, fetched: count });
    } catch (e: any) {
      results.push({ storeId: ch.storeId, email: ch.email, error: e.message });
    }
  }

  return NextResponse.json({ success: true, data: results });
}
