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
          { userId: session.id },
          ...(storeIds.length > 0 ? [{ storeId: { in: storeIds } }] : []),
        ],
      },
      select: { id: true },
    });
    if (!partner) {
      return NextResponse.json({ success: true, data: [], total: 0 });
    }

    const payouts = await prisma.partnerPayout.findMany({
      where: { partnerId: partner.id },
      orderBy: { requestedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: payouts });
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

    const partner = await prisma.partner.findFirst({
      where: {
        OR: [
          { userId: session.id },
          ...(storeIds.length > 0 ? [{ storeId: { in: storeIds } }] : []),
        ],
      },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: "Not a partner" }, { status: 400 });
    }

    const config = await prisma.partnerConfig.findFirst();
    const minPayout = config?.minPayout || 50;

    const body = await request.json();
    const amount = parseFloat(body.amount);

    if (!amount || amount < minPayout) {
      return NextResponse.json({
        success: false,
        error: `Minimum payout is $${minPayout}`,
      }, { status: 400 });
    }

    if (amount > partner.totalEarned - partner.totalPaid) {
      return NextResponse.json({
        success: false,
        error: "Insufficient balance",
      }, { status: 400 });
    }

    const payout = await prisma.partnerPayout.create({
      data: {
        partnerId: partner.id,
        amount,
        currency: "USD",
        status: "pending",
        paymentMethod: body.paymentMethod || partner.paymentMethod || "bank_transfer",
        notes: body.notes,
      },
    });

    return NextResponse.json({ success: true, data: payout });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
