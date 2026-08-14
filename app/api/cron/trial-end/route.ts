import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { trialEndingEmail } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== process.env.CRON_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { email: string; daysLeft: number; sent: boolean; error?: string }[] = [];

  try {
    const trialingStores = await prisma.store.findMany({
      where: { subscriptions: { some: { status: "trialing" } } },
      include: {
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
        user: { select: { email: true, name: true } },
      },
    });

    for (const store of trialingStores) {
      const sub = store.subscriptions[0];
      if (!sub) continue;
      const trialEnd = sub.currentPeriodEnd;
      if (!trialEnd) continue;

      const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / 86400000);
      if (daysLeft > 7 || daysLeft < -1) continue;

      const email = store.user?.email;
      if (!email) continue;

      try {
        await trialEndingEmail({
          email,
          storeName: store.name || "Your Store",
          daysLeft,
          dashboardUrl: `https://chatbot.circucity.com`,
        });
        results.push({ email, daysLeft, sent: true });
      } catch (e: any) {
        results.push({ email, daysLeft, sent: false, error: e.message });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  return NextResponse.json({ sent: results.length, results });
}
