import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

const SYNC_SECRET = process.env.PARTNERS_SYNC_SECRET || "";
const API = process.env.PARTNERS_URL || "http://127.0.0.1:3006";

export async function POST(req: NextRequest) {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { partnerIds, subject, body } = await req.json();
  if (!Array.isArray(partnerIds) || partnerIds.length === 0) return NextResponse.json({ error: "Select at least one partner" }, { status: 400 });
  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: "Subject and message required" }, { status: 400 });

  const partners = await prisma.partner.findMany({ where: { id: { in: partnerIds } } });
  if (partners.length === 0) return NextResponse.json({ error: "No partners found" }, { status: 404 });

  // Map chatbot partners -> partners.circucity.com users by email
  const crmPartners = await fetch(API + "/api/sync/partners", { headers: { "x-sync-secret": SYNC_SECRET } })
    .then(r => r.json()).then(d => d.partners || []).catch(() => []);
  const crmIdByEmail = new Map(crmPartners.map((c: any) => [c.email?.toLowerCase(), c.id]));
  const recipients = partners.filter(p => p.email && crmIdByEmail.has(p.email.toLowerCase()));
  if (recipients.length === 0) return NextResponse.json({ error: "None of the selected partners have an activated partners.circucity.com account" }, { status: 400 });

  // Deliver to partners.circucity.com (individual or bulk)
  const delivered = await fetch(API + "/api/sync/messages", {
    method: "POST",
    headers: { "x-sync-secret": SYNC_SECRET, "Content-Type": "application/json" },
    body: JSON.stringify({ partnerIds: recipients.map(p => crmIdByEmail.get(p.email!.toLowerCase())), subject: subject.trim(), body: body.trim() }),
  }).then(r => r.json()).catch(() => ({ error: "Partner platform unavailable" }));

  if (delivered.error) return NextResponse.json({ error: delivered.error }, { status: 502 });

  // Record history
  await prisma.partnerMessage.createMany({
    data: recipients.map(p => ({ partnerId: p.id, subject: subject.trim(), body: body.trim() })),
  });

  await prisma.staffActivity.create({
    data: {
      userId: admin.id,
      action: "partner_message",
      details: `Message "${subject.trim().slice(0, 80)}" sent to ${delivered.count || recipients.length} partner(s) via partners.circucity.com`,
    },
  });

  return NextResponse.json({ success: true, count: delivered.count || recipients.length, skipped: partners.length - recipients.length });
}

export async function GET(req: NextRequest) {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const partnerId = req.nextUrl.searchParams.get("partnerId");
  if (!partnerId) return NextResponse.json({ error: "partnerId required" }, { status: 400 });

  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const crmPartners = await fetch(API + "/api/sync/partners", { headers: { "x-sync-secret": SYNC_SECRET } })
    .then(r => r.json()).then(d => d.partners || []).catch(() => []);
  const crmUser = partner.email ? crmPartners.find((c: any) => c.email?.toLowerCase() === partner.email.toLowerCase()) : null;

  const [history, crm] = await Promise.all([
    prisma.partnerMessage.findMany({ where: { partnerId }, orderBy: { createdAt: "desc" }, take: 50 }),
    crmUser
      ? fetch(API + "/api/sync/messages?partner_id=" + encodeURIComponent(crmUser.id), { headers: { "x-sync-secret": SYNC_SECRET } })
          .then(r => r.json()).catch(() => ({ messages: [] }))
      : Promise.resolve({ messages: [] }),
  ]);

  return NextResponse.json({ success: true, history, delivered: crm.messages || [], crmUser: crmUser ? { id: crmUser.id, name: crmUser.name } : null });
}
