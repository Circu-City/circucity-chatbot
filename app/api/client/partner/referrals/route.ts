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

    const referrals = await prisma.partnerReferral.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: referrals, total: referrals.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
