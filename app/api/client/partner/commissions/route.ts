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

    const commissions = await prisma.partnerCommission.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const summary = {
      pending: commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0),
      approved: commissions.filter((c) => c.status === "approved").reduce((s, c) => s + c.amount, 0),
      paid: commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0),
      total: commissions.reduce((s, c) => s + c.amount, 0),
    };

    return NextResponse.json({ success: true, data: commissions, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
