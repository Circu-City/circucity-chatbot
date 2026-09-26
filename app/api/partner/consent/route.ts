import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse(confirmationPage("invalid", ""), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  let payload: { email: string; type: string; opt: string };
  try {
    payload = verify(token, JWT_SECRET) as any;
  } catch {
    return new NextResponse(confirmationPage("invalid", ""), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (payload.type !== "partner-consent" || !payload.email || !["yes", "no"].includes(payload.opt)) {
    return new NextResponse(confirmationPage("invalid", ""), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const marketingConsent = payload.opt === "yes";
  const email = String(payload.email).toLowerCase();
  const now = new Date();

  try {
    await prisma.partnerConsent.upsert({
      where: { email_type: { email, type: "partner" } },
      create: { email, type: "partner", marketingConsent, consentedAt: now, source: "email" },
      update: { marketingConsent, consentedAt: now },
    });

    const partner = await prisma.partner.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (partner) {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { marketingConsent, consentUpdatedAt: now },
      });
    }
  } catch (e) {
    console.error("[Partner Consent Error]", e);
  }

  return new NextResponse(confirmationPage(payload.opt, email), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function confirmationPage(opt: string, email: string): string {
  const content =
    opt === "invalid"
      ? `<p style="color:#475569;font-size:15px">This link is invalid or has expired. If you still want to update your preferences, contact <a href="mailto:support@circucity.com" style="color:#0A1428;font-weight:600">support@circucity.com</a>.</p>`
      : `<div style="background:#f0fdf4;border-radius:12px;padding:24px;text-align:center;margin:16px 0">
           <div style="font-size:40px;margin-bottom:8px">${opt === "yes" ? "✅" : "🤐"}</div>
           <p style="color:#166534;font-size:16px;font-weight:700;margin:0">You're ${opt === "yes" ? "all set - we'll keep you posted!" : "on the quiet list - no offers from us."}</p>
         </div>
         <p style="color:#475569;font-size:14px">Your communication preference for <strong>${email}</strong> has been updated.</p>
         <p style="color:#64748b;font-size:13px">You can change this at any time from your dashboard settings or by clicking the links in any CircuCity AI email.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CircuCity AI - Communication Preferences</title>
</head>
<body style="margin:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:520px;margin:48px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#0A1428;padding:20px 28px">
      <div style="font-size:18px;font-weight:800;color:#ffffff">CircuCity <span style="color:#A3E635">AI</span></div>
      <div style="font-size:11px;color:#94a3b8;margin-top:2px;letter-spacing:1px">CONVERSATIONAL INTELLIGENCE</div>
    </div>
    <div style="padding:28px">
      <h1 style="color:#0A1428;font-size:20px;font-weight:800;margin:0 0 12px">Communication Preferences</h1>
      ${content}
    </div>
    <div style="background:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0">
      <p style="margin:0;font-size:12px;color:#64748b">CircuCity AI · support@circucity.com</p>
    </div>
  </div>
</body>
</html>`;
}