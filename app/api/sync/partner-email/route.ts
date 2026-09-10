import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  sendEmail,
  partnerApplicationReceivedEmail,
  partnerApprovedEmail,
  partnerRejectedEmail,
  partnerAccountActivatedEmail,
  offersConsentEmail,
  buildConsentUrls,
} from "@/lib/email";

const SYNC_SECRET = process.env.PARTNERS_SYNC_SECRET || "";
const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

async function getAdminEmails(): Promise<string[]> {
  const envAdmin = process.env.ADMIN_EMAIL || '';
  const list = new Set<string>();
  for (const em of envAdmin.split(',')) {
    const trimmed = em.trim().toLowerCase();
    if (trimmed && trimmed.includes('@')) list.add(trimmed);
  }
  list.add('nassershangwe29@gmail.com');
  list.add('nassershangwe@gmail.com');
  list.add('admin@circucity.com');
  try {
    const dbAdmins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { email: true },
    });
    for (const a of dbAdmins) {
      if (a.email && a.email.includes('@')) list.add(a.email.toLowerCase().trim());
    }
  } catch {}
  return Array.from(list);
}

export async function POST(request: Request) {
  const key = request.headers.get("x-sync-secret");
  if (!key || key !== SYNC_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { type, email, name, program, setupUrl, country, reason, dashboardUrl } = body;
    if (!type || !email) {
      return NextResponse.json({ success: false, error: "type and email required" }, { status: 400 });
    }

    let ok = false;
    const consent = buildConsentUrls(email);

    switch (type) {
      case "application_received":
      case "approved":
        ok = await partnerApprovedEmail({
          email,
          name: name || "",
          program: program || "Affiliate Partner",
          setupUrl: setupUrl || `${BASE_URL}/partner/setup`,
          consentUrlYes: consent.consentUrlYes,
          consentUrlNo: consent.consentUrlNo,
        });
        break;
      case "admin_notification":
        const adminEmails = await getAdminEmails();
        for (const adminEmail of adminEmails) {
          await sendEmail({
            to: adminEmail,
            subject: `New Partner Application: ${name || 'Partner'} (${program || 'Affiliate'})`,
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
                <div style="background:#0A1428;padding:16px 20px;border-radius:10px;margin-bottom:20px">
                  <span style="color:#ffffff;font-size:16px;font-weight:700">CircuCity <span style="color:#A3E635">AI</span> Partner Alert</span>
                </div>
                <h2 style="color:#0A1428;font-size:20px;margin:0 0 12px">New Partner Application (via Portal)</h2>
                <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #e2e8f0;font-size:14px;color:#334155">
                  <p style="margin:6px 0"><strong>Name:</strong> ${name || 'Partner'}</p>
                  <p style="margin:6px 0"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                  <p style="margin:6px 0"><strong>Program:</strong> ${program || 'Affiliate Partner'}</p>
                  ${country ? `<p style="margin:6px 0"><strong>Country:</strong> ${country}</p>` : ''}
                  ${setupUrl ? `<p style="margin:6px 0"><strong>Setup URL:</strong> <a href="${setupUrl}">${setupUrl}</a></p>` : ''}
                </div>
              </div>
            `,
            text: `New partner application from ${name} (${email}, ${country || 'N/A'}).`,
          });
        }
        ok = true;
        break;
      case "rejected":
        ok = await partnerRejectedEmail({ email, name: name || "", program: program || "", reason });
        break;
      case "account_activated":
        ok = await partnerAccountActivatedEmail({
          email,
          name: name || "",
          program: program || "",
          dashboardUrl: dashboardUrl || `${BASE_URL}/partner/dashboard`,
        });
        break;
      case "offers_consent":
        ok = await offersConsentEmail({
          email,
          name: name || "",
          consentUrlYes: consent.consentUrlYes,
          consentUrlNo: consent.consentUrlNo,
          type: "partner",
        });
        break;
      default:
        return NextResponse.json({ success: false, error: `Unknown email type: ${type}` }, { status: 400 });
    }

    if (!ok) {
      return NextResponse.json({ success: false, error: "Email delivery failed" }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Partner Email Sync Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
