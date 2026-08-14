"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCurrentStore() {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({
    where: { userId: session.id },
    include: {
      organization: { select: { id: true, name: true, plan: true } },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      embedSettings: true,
      _count: { select: { products: true, conversations: true } },
    },
  });
  if (!store) return null;

  // Attach user info
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true },
  });

  return { ...store, user };
}

export async function updateStoreProfile(data: {
  name?: string;
  url?: string;
  industry?: string;
  businessName?: string;
  aboutBusiness?: string;
  contactInfo?: string;
  operatingHours?: string;
  tone?: string;
  personality?: string;
  greetingMessage?: string;
}) {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({ where: { userId: session.id } });
  if (!store) throw new Error("No store found");

  const updateData: any = {};
  const fields = [
    "name", "url", "industry", "businessName", "aboutBusiness", "contactInfo",
    "operatingHours", "tone", "personality", "greetingMessage",
  ];
  for (const field of fields) {
    if ((data as any)[field] !== undefined) {
      updateData[field] = (data as any)[field];
    }
  }

  const updated = await prisma.store.update({ where: { id: store.id }, data: updateData });
  revalidatePath("/dashboard");
  return updated;
}

export async function getStoreSubscription() {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({
    where: { userId: session.id },
    select: { id: true, plan: true },
  });
  if (!store) return null;

  const subscription = await prisma.subscription.findFirst({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  // If subscription exists with active/trialing paid plan, use its plan
  // (covers the case where webhook hasn't updated store.plan yet)
  const effectivePlan =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    (subscription.plan === "growth" || subscription.plan === "scale" || subscription.plan === "enterprise")
      ? subscription.plan
      : store.plan;
  return {
    ...(subscription || {}),
    plan: effectivePlan || "free",
    status: subscription?.status || "active",
  };
}

export async function getStoreAnalytics(range: string = "30d") {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!store) return null;

  const now = new Date();
  let startDate: Date;

  switch (range) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startDate = new Date(0);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const usageLogs = await prisma.usageLog.findMany({
    where: { storeId: store.id, date: { gte: startDate } },
    orderBy: { date: "asc" },
  });

  const totalMessages = usageLogs.reduce((sum, log) => sum + log.messagesCount, 0);

  const nowMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const conversationsThisMonth = await prisma.conversation.count({
    where: { storeId: store.id, createdAt: { gte: nowMonthStart } },
  });

  const allConvs = await prisma.conversation.findMany({
    where: { storeId: store.id },
    select: { id: true, resolved: true },
  });
  const totalConversations = allConvs.length;
  const resolvedCount = allConvs.filter(c => c.resolved).length;
  const resolutionRate = totalConversations > 0 ? Math.round((resolvedCount / totalConversations) * 100) : 0;

  const [csatEvents, leadEvents, visitEvents] = await Promise.all([
    prisma.widgetEvent.findMany({
      where: { storeId: store.id, event: "csat_rating", createdAt: { gte: startDate } },
      select: { data: true },
    }),
    prisma.widgetEvent.count({
      where: { storeId: store.id, event: "lead_captured", createdAt: { gte: startDate } },
    }),
    prisma.widgetEvent.count({
      where: { storeId: store.id, event: "widget_loaded", createdAt: { gte: startDate } },
    }),
  ]);
  const rated = csatEvents
    .map((e: any) => {
      try {
        const d = JSON.parse(e.data || "{}");
        return Number(d.rating);
      } catch {
        return NaN;
      }
    })
    .filter((n: number) => !isNaN(n));
  const csatScore = rated.length
    ? Math.round((rated.reduce((a: number, b: number) => a + b, 0) / rated.length) * 10) / 10
    : 0;
  const conversionRate = visitEvents > 0 ? Math.round((leadEvents / visitEvents) * 1000) / 10 : 0;

  return {
    summary: {
      total_messages: totalMessages,
      total_conversations: totalConversations,
      period: range,
    },
    totalMessages,
    totalConversations,
    conversationsThisMonth: conversationsThisMonth,
    resolvedCount,
    resolutionRate,
    conversionRate,
    csatScore,
    csatResponses: rated.length,
    leadsCaptured: leadEvents,
    visitorsTracked: visitEvents,
    usageLogs,
  };
}

export async function getStoreConversations(limit = 10) {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!store) return [];

  const conversations = await prisma.conversation.findMany({
    where: { storeId: store.id },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      sessionId: true,
      messages: true,
      createdAt: true,
      updatedAt: true,
      customerName: true,
      resolved: true,
    },
  });

  return conversations;
}

export async function getStoreProducts() {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!store) return [];

  return prisma.product.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStoreProduct(data: {
  name: string;
  price: number;
  description?: string;
  category?: string;
  stock?: number;
  currency?: string;
  image?: string;
}) {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({ where: { userId: session.id } });
  if (!store) throw new Error("No store found");

  const product = await prisma.product.create({
    data: {
      storeId: store.id,
      name: data.name,
      price: data.price,
      description: data.description,
      category: data.category,
      stock: data.stock,
      currency: data.currency || "USD",
      image: data.image,
    },
  });

  revalidatePath("/dashboard");
  return product;
}

export async function deleteStoreProduct(productId: string) {
  const session = await requireAuth();
  const store = await prisma.store.findFirst({ where: { userId: session.id } });
  if (!store) throw new Error("No store found");

  const product = await prisma.product.findFirst({
    where: { id: productId, storeId: store.id },
  });
  if (!product) throw new Error("Product not found");

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/dashboard");
  return { success: true };
}
