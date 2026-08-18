import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { partnerIds, subject, body } = await req.json();
  if (!Array.isArray(partnerIds) || partnerIds.length === 0) return NextResponse.json({ error: "Select at least one partner" }, { status: 400 });
  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: "Subject and message required" }, { status: 400 });

  const partners = await prisma.partner.findMany({ where: { id: { in: partnerIds } } });
  if (partners.length === 0) return NextResponse.json({ error: "No partners found" }, { status: 404 });

  const results: { email: string; sent: boolean; error?: string }[] = [];
  for (const p of partners) {
    const to = p.email || p.paymentEmail;
    if (!to) {
      results.push({ email: p.id, sent: false, error: "No email on file" });
      continue;
    }
    const ok = await sendEmail({
      to,
      subject: subject.trim(),
      text: body.trim(),
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto"><h2 style="color:#0A1428">${subject.trim()}</h2><div style="color:#334155;line-height:1.6;white-space:pre-wrap">${body.trim().replace(/\n/g, "<br>")}</div><p style="color:#94a3b8;font-size:12px;margin-top:24px">CircuCity AI - Global Sales Partner Program</p></div>`,
    });
    if (ok) {
      await prisma.partnerMessage.create({ data: { partnerId: p.id, subject: subject.trim(), body: body.trim() } });
    }
    results.push({ email: to, sent: ok });
  }

  await prisma.staffActivity.create({
    data: {
      userId: admin.id,
      action: "partner_email",
      details: `Email "${subject.trim().slice(0, 80)}" sent to ${results.filter(r => r.sent).length}/${results.length} partners`,
    },
  });

  return NextResponse.json({ success: true, results });
}
