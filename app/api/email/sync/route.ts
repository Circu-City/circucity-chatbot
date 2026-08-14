import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const Imap = require("imap");
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");

const CHAT_ENDPOINT = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

function connectImap(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
}): Promise<any> {
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

      msg.on("body", (stream: any, info: any) => {
        let buffer = "";
        stream.on("data", (chunk: any) => { buffer += chunk.toString("utf8"); });
        stream.on("end", () => { email.raw = buffer; });
      });

      msg.once("attributes", (attrs: any) => {
        email.uid = attrs.uid;
        email.flags = attrs.flags;
        email.date = attrs.date;
      });

      msg.once("end", () => { emails.push(email); });
    });

    fetch.once("error", (err: any) => reject(err));
    fetch.once("end", () => resolve(emails));
  });
}

function parseEmail(raw: string): Promise<any> {
  return simpleParser(raw);
}

async function sendReplyViaSmtp(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    subject: `Re: ${config.subject}`,
    text: config.text,
  });
}

async function processEmail(
  storeId: string,
  fromEmail: string,
  fromName: string,
  subject: string,
  bodyText: string,
  emailChannel: any
): Promise<void> {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store?.apiKey) return;

  const sessionId = `email_${fromEmail}`;
  const fullMessage = `[Email from ${fromName} <${fromEmail}>]\nSubject: ${subject}\n\n${bodyText}`;

  const existing = await prisma.conversation.findFirst({ where: { sessionId } });

  if (existing) {
    const msgs = JSON.parse(existing.messages || "[]");
    msgs.push({ role: "user", content: fullMessage, timestamp: new Date().toISOString(), source: "email" });
    await prisma.conversation.update({
      where: { id: existing.id },
      data: { messages: JSON.stringify(msgs), updatedAt: new Date() },
    });
  } else {
    await prisma.conversation.create({
      data: {
        storeId,
        sessionId,
        customerName: fromName || fromEmail,
        customerEmail: fromEmail,
        messages: JSON.stringify([{ role: "user", content: fullMessage, timestamp: new Date().toISOString(), source: "email" }]),
      },
    });
  }

  try {
    const res = await fetch(`${CHAT_ENDPOINT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: bodyText,
        sessionId,
        apiKey: store.apiKey,
        customerName: fromName || fromEmail,
        customerEmail: fromEmail,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const reply: string = json.reply;
      if (reply) {
        const conversation = await prisma.conversation.findUnique({ where: { sessionId } });
        if (conversation) {
          const msgs = JSON.parse(conversation.messages || "[]");
          msgs.push({ role: "bot", content: reply, timestamp: new Date().toISOString(), source: "email" });
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { messages: JSON.stringify(msgs) },
          });
        }

        await sendReplyViaSmtp({
          host: emailChannel.smtpHost,
          port: emailChannel.smtpPort || 587,
          user: emailChannel.smtpUser || emailChannel.email,
          pass: emailChannel.smtpPass,
          from: emailChannel.email,
          to: fromEmail,
          subject,
          text: reply,
        });
      }
    }
  } catch (e) {
    console.error("Email AI processing error:", e);
  }
}

export async function POST() {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const emailChannel = await prisma.emailChannel.findUnique({ where: { storeId: store.id } });
    if (!emailChannel) return NextResponse.json({ success: false, error: "Email not configured" }, { status: 400 });

    if (!emailChannel.imapHost || !emailChannel.imapPass) {
      return NextResponse.json({ success: false, error: "IMAP not configured" }, { status: 400 });
    }

    const imapConfig = {
      host: emailChannel.imapHost,
      port: emailChannel.imapPort || 993,
      user: emailChannel.imapUser || emailChannel.email,
      pass: emailChannel.imapPass,
    };

    let fetchedCount = 0;

    try {
      const imap = await connectImap(imapConfig);
      await openInbox(imap);
      const uids = await searchUnseen(imap);

      if (uids.length > 0) {
        const emails = await fetchEmails(imap, uids.slice(0, 20));

        for (const email of emails) {
          try {
            const parsed = await parseEmail(email.raw);
            const fromEmail = parsed.from?.value?.[0]?.address || "unknown";
            const fromName = parsed.from?.value?.[0]?.name || fromEmail;
            const subject = parsed.subject || "(No subject)";
            const bodyText = parsed.text || parsed.html || "";

            if (fromEmail && bodyText && fromEmail !== emailChannel.email) {
              await processEmail(store.id, fromEmail, fromName, subject, bodyText.substring(0, 10000), emailChannel);
              fetchedCount++;
            }
          } catch (parseErr) {
            console.error("Email parse error:", parseErr);
          }
        }
      }

      imap.end();
    } catch (imapErr) {
      console.error("IMAP connection error:", imapErr);
      return NextResponse.json({
        success: false,
        error: "IMAP connection failed. Check your email credentials.",
      }, { status: 400 });
    }

    await prisma.emailChannel.update({
      where: { storeId: store.id },
      data: { lastSyncAt: new Date(), verified: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        lastSyncAt: new Date().toISOString(),
        fetched: fetchedCount,
        message: fetchedCount > 0 ? `Processed ${fetchedCount} new email(s)` : "No new emails",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
