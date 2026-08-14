import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const Imap = require("imap");

function testImapConnection(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.user,
      password: config.pass,
      host: config.host,
      port: config.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const timeout = setTimeout(() => {
      try { imap.end(); } catch {}
      reject(new Error("Connection timed out"));
    }, 10000);

    imap.once("ready", () => {
      clearTimeout(timeout);
      imap.end();
      resolve("IMAP connection successful");
    });

    imap.once("error", (err: any) => {
      clearTimeout(timeout);
      reject(err);
    });

    imap.connect();
  });
}

export async function POST() {
  try {
    const user = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: user.id } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const emailChannel = await prisma.emailChannel.findUnique({ where: { storeId: store.id } });
    if (!emailChannel) return NextResponse.json({ success: false, error: "Email not configured" }, { status: 400 });

    const results: string[] = [];
    let allOk = true;

    if (emailChannel.imapHost) {
      try {
        const msg = await testImapConnection({
          host: emailChannel.imapHost,
          port: emailChannel.imapPort || 993,
          user: emailChannel.imapUser || emailChannel.email,
          pass: emailChannel.imapPass,
        });
        results.push(msg);
      } catch (e: any) {
        allOk = false;
        results.push(`IMAP: ${e.message}`);
      }
    }

    if (allOk) {
      await prisma.emailChannel.update({ where: { storeId: store.id }, data: { verified: true } });
    }

    return NextResponse.json({
      success: allOk,
      data: { results, smtp: true, imap: allOk, message: results.join("; ") },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
