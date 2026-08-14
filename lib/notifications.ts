import prisma from "@/lib/db";
import { newConversationEmail, escalationEmail, weeklyDigestEmail } from "./email";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

type NotifPrefs = {
  emailAlerts?: boolean;
  escalationAlerts?: boolean;
  weeklyReport?: boolean;
  productUpdates?: boolean;
};

async function getNotificationPrefs(storeId: string): Promise<{ prefs: NotifPrefs; email: string | null }> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { metadata: true, userId: true },
  });
  if (!store) return { prefs: {}, email: null };

  let prefs: NotifPrefs = { emailAlerts: true, escalationAlerts: true, weeklyReport: false };
  if (store.metadata) {
    try {
      const meta = JSON.parse(store.metadata);
      if (meta.notifications) prefs = { ...prefs, ...meta.notifications };
    } catch {}
  }

  const user = await prisma.user.findUnique({ where: { id: store.userId }, select: { email: true } });
  return { prefs, email: user?.email || null };
}

export async function notifyNewConversation(storeId: string, customerName: string, message: string) {
  const { prefs, email } = await getNotificationPrefs(storeId);
  if (!prefs.emailAlerts || !email) return;

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
  await newConversationEmail({
    email,
    storeName: store?.name || "Your Store",
    customerName: customerName || "Anonymous",
    message,
    dashboardUrl: `${DASHBOARD_URL}/dashboard?tab=conversations`,
  });
}

export async function notifyEscalation(storeId: string, customerName: string | null, reason: string | null) {
  const { prefs, email } = await getNotificationPrefs(storeId);
  if (!prefs.escalationAlerts || !email) return;

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
  await escalationEmail({
    email,
    storeName: store?.name || "Your Store",
    customerName: customerName || "Anonymous",
    reason: reason || "Customer requested human assistance",
    dashboardUrl: `${DASHBOARD_URL}/dashboard?tab=conversations`,
  });
}

export async function sendWeeklyDigests() {
  const stores = await prisma.store.findMany({
    where: { status: "active" },
    select: { id: true, name: true, userId: true, metadata: true },
  });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const store of stores) {
    let prefs: NotifPrefs = {};
    if (store.metadata) {
      try {
        const meta = JSON.parse(store.metadata);
        if (meta.notifications) prefs = meta.notifications;
      } catch {}
    }
    if (!prefs.weeklyReport) continue;

    const user = await prisma.user.findUnique({ where: { id: store.userId }, select: { email: true } });
    if (!user?.email) continue;

    const conversations = await prisma.conversation.count({
      where: { storeId: store.id, createdAt: { gte: weekAgo } },
    });
    const resolved = await prisma.conversation.count({
      where: { storeId: store.id, resolved: true, createdAt: { gte: weekAgo } },
    });
    const escalated = await prisma.conversation.count({
      where: { storeId: store.id, escalated: true, createdAt: { gte: weekAgo } },
    });

    let unansweredCount = 0;
    const storeData = await prisma.store.findUnique({ where: { id: store.id }, select: { crawlData: true } });
    if (storeData?.crawlData) {
      try {
        const cd = JSON.parse(storeData.crawlData);
        unansweredCount = (cd.unanswered || []).filter((u: any) => new Date(u.timestamp) >= weekAgo).length;
      } catch {}
    }

    await weeklyDigestEmail({
      email: user.email,
      storeName: store.name || "Your Store",
      stats: { conversations, resolved, escalated, unanswered: unansweredCount },
    });
  }
}
