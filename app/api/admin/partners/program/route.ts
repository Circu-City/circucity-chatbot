import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

export async function GET(req: NextRequest) {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status");
  const partners = await prisma.partner.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true, emailVerified: true, role: true, createdAt: true } },
      referrals: { select: { id: true, status: true, commission: true, clickedAt: true, convertedAt: true, createdAt: true } },
      commissions: { select: { id: true, amount: true, currency: true, status: true, createdAt: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, subject: true, body: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = partners.map(p => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    paymentEmail: p.paymentEmail,
    phone: p.phone,
    country: p.country,
    type: p.type,
    status: p.status,
    referralCode: p.referralCode,
    link: BASE_URL + "/?ref=" + p.referralCode,
    clickCount: p.clickCount,
    referralCount: p.referralCount,
    conversionRate: p.conversionRate,
    totalEarned: p.totalEarned,
    totalPaid: p.totalPaid,
    approvedAt: p.approvedAt,
    createdAt: p.createdAt,
    registered: !!p.userId,
    activated: p.emailVerified,
    account: p.user
      ? { id: p.user.id, name: p.user.name, email: p.user.email, emailVerified: p.user.emailVerified, role: p.user.role, createdAt: p.user.createdAt }
      : null,
    referrals: p.referrals.length,
    convertedReferrals: p.referrals.filter(r => r.status === "converted").length,
    commissionEarned: p.commissions.reduce((s, c) => s + (c.status !== "pending" ? c.amount : 0), 0),
    commissionsPending: p.commissions.filter(c => c.status === "pending").length,
    messages: p.messages,
  }));

  const stats = {
    total: data.length,
    approved: data.filter(d => d.status === "approved").length,
    registered: data.filter(d => d.registered).length,
    activated: data.filter(d => d.activated).length,
    noActivity: data.filter(d => d.registered && d.clickCount === 0 && d.referralCount === 0).length,
  };

  return NextResponse.json({ success: true, partners: data, stats });
}
