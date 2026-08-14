import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();

    const userStores = await prisma.store.findMany({
      where: { userId: session.id },
      select: { id: true },
    });
    const storeIds = userStores.map(s => s.id);

    const partner = await prisma.partner.findFirst({
      where: {
        OR: [
          { userId: session.id, status: 'active' },
          ...(storeIds.length > 0 ? [{ storeId: { in: storeIds }, userId: { not: null }, status: 'active' }] : []),
        ],
      },
      include: {
        _count: { select: { referrals: true, commissions: true, payouts: true } },
      },
    });

    const config = await prisma.partnerConfig.findFirst();

    const recentCommissions = partner
      ? await prisma.partnerCommission.findMany({
          where: { partnerId: partner.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        partner: partner || null,
        config,
        recentCommissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const userStores = await prisma.store.findMany({
      where: { userId: session.id },
      select: { id: true },
    });
    const storeIds = userStores.map(s => s.id);

    const existing = await prisma.partner.findFirst({
      where: {
        OR: [
          { userId: session.id, status: 'active' },
          ...(storeIds.length > 0 ? [{ storeId: { in: storeIds }, userId: { not: null }, status: 'active' }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Partner profile not found. Apply via the partner program form first." }, { status: 404 });
    }

    const body = await request.json();
    const { type, paymentEmail, paymentMethod, taxInfo, website, bio } = body;

    const partner = await prisma.partner.update({
      where: { id: existing.id },
      data: {
        type: type ?? undefined,
        paymentEmail: paymentEmail ?? undefined,
        paymentMethod: paymentMethod ?? undefined,
        taxInfo: taxInfo ?? undefined,
        website: website ?? undefined,
        bio: bio ?? undefined,
      },
    });

    return NextResponse.json({ success: true, data: partner });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
