import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

const SYNC_SECRET = process.env.PARTNERS_SYNC_SECRET || "";
const API = process.env.PARTNERS_URL || "http://127.0.0.1:3006";
const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

export async function GET() {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: { in: ["admin", "staff", "partner"] } },
    select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true },
    orderBy: { createdAt: "asc" },
  });

  const partners = await prisma.partner.findMany({});
  const partnerByEmail = new Map(partners.map(p => [p.email?.toLowerCase(), p]));

  const [sentCounts, unread, activities] = await Promise.all([
    prisma.staffMessage.groupBy({ by: ["senderId"], _count: { _all: true } }),
    prisma.staffMessage.groupBy({ by: ["senderId"], where: { readAt: null }, _count: { _all: true } }),
    prisma.staffActivity.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);
  const sentMap = Object.fromEntries(sentCounts.map(r => [r.senderId, r._count._all]));
  const unreadMap = Object.fromEntries(unread.map(r => [r.senderId, r._count._all]));
  const actByUser = new Map<string, { id: string; action: string; details: string | null; createdAt: Date }[]>();
  for (const a of activities) {
    const arr = actByUser.get(a.userId) || [];
    if (arr.length < 25) arr.push(a);
    actByUser.set(a.userId, arr);
  }

  let crmPartners: any[] = [];
  let crmLeads: any[] = [];
  try {
    const r = await fetch(API + "/api/sync/partners", { headers: { "x-sync-secret": SYNC_SECRET } });
    crmPartners = (await r.json()).partners || [];
  } catch {}
  try {
    const r = await fetch(API + "/api/sync/leads", { headers: { "x-sync-secret": SYNC_SECRET } });
    crmLeads = (await r.json()).leads || [];
  } catch {}

  const leadByPartnerName = new Map<string, any[]>();
  for (const l of crmLeads) {
    const k = l.partner_name?.toLowerCase();
    if (!k) continue;
    const arr = leadByPartnerName.get(k) || [];
    arr.push(l);
    leadByPartnerName.set(k, arr);
  }

  const mapLead = (l: any) => ({
    id: l.id,
    company: l.company,
    contact: l.contact_name,
    email: l.email,
    stage: l.stage,
    value: l.expected_value_usd,
    nextFollowup: l.next_followup,
    notes: l.notes,
    source: l.source,
    createdAt: l.created_at,
  });

  const staff = users.map(u => {
    const p = partnerByEmail.get(u.email?.toLowerCase());
    const crmUser = crmPartners.find(c => c.email?.toLowerCase() === u.email?.toLowerCase());
    const leads = leadByPartnerName.get(u.name?.toLowerCase()) || [];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      emailVerified: !!u.emailVerified,
      partner: p
        ? {
            id: p.id,
            status: p.status,
            type: p.type,
            referralCode: p.referralCode,
            clickCount: p.clickCount,
            referralCount: p.referralCount,
            conversionRate: p.conversionRate,
            totalEarned: p.totalEarned,
            totalPaid: p.totalPaid,
            approvedAt: p.approvedAt,
            link: BASE_URL + "/?ref=" + p.referralCode,
          }
        : null,
      crm: crmUser
        ? { registered: true, activated: !crmUser.setup_token, createdAt: crmUser.created_at }
        : { registered: false, activated: false, createdAt: null },
      messagesSent: sentMap[u.id] || 0,
      unreadFromThem: unreadMap[u.id] || 0,
      recentActivities: actByUser.get(u.id) || [],
      leads: leads.map(mapLead),
    };
  });

  const crmOnly = crmPartners
    .filter(c => !users.some(u => u.email?.toLowerCase() === c.email?.toLowerCase()))
    .map(c => ({
      id: c.id,
      crmId: c.id,
      name: c.name,
      email: c.email,
      role: "partner",
      createdAt: c.created_at,
      emailVerified: false,
      partner: null,
      crm: { registered: true, activated: !c.setup_token, createdAt: c.created_at },
      messagesSent: 0,
      unreadFromThem: 0,
      recentActivities: [],
      leads: (leadByPartnerName.get(c.name?.toLowerCase()) || []).map(mapLead),
    }));

  return NextResponse.json({ success: true, staff: [...staff, ...crmOnly] });
}
