"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth";

// ==================== USERS CRUD ====================

export async function getUsers(page = 1, limit = 20, search?: string) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { stores: { select: { id: true, name: true, status: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(id: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id },
    include: {
      stores: {
        include: {
          products: { take: 5, orderBy: { createdAt: "desc" } },
          subscriptions: true,
          _count: { select: { conversations: true, apiKeys: true } },
        },
      },
    },
  });
}

export async function updateUser(id: string, data: { name?: string; email?: string; role?: "customer" | "admin" }) {
  await requireAdmin();
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.role !== undefined && { role: data.role }),
    },
  });
  revalidatePath("/admin");
  return user;
}

export async function deleteUser(id: string) {
  await requireAdmin();
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}

export async function createUser(data: { name?: string; email: string; password: string; role?: "customer" | "admin" }) {
  await requireAdmin();
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error("Email already exists");

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: (data.role as any) || "customer",
    },
  });
  revalidatePath("/admin");
  return user;
}

// ==================== STORES CRUD ====================

export async function getStores(page = 1, limit = 20, search?: string, statusFilter?: string) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { url: { contains: search, mode: "insensitive" as const } },
    ];
  }
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscriptions: { take: 1, orderBy: { createdAt: "desc" } },
        _count: { select: { products: true, conversations: true } },
      },
    }),
    prisma.store.count({ where }),
  ]);

  return { stores, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getStoreById(id: string) {
  await requireAdmin();
  return prisma.store.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      products: { orderBy: { createdAt: "desc" } },
      subscriptions: { orderBy: { createdAt: "desc" } },
      conversations: { orderBy: { createdAt: "desc" }, take: 20 },
      apiKeys: true,
      embedSettings: true,
      usageLogs: { orderBy: { date: "desc" }, take: 30 },
    },
  });
}

export async function updateStore(id: string, data: { name?: string; status?: string; industry?: string; tone?: string }) {
  await requireAdmin();
  const store = await prisma.store.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.industry !== undefined && { industry: data.industry }),
      ...(data.tone !== undefined && { tone: data.tone }),
    },
  });
  revalidatePath("/admin");
  await logAdminAction("update_store", "Store", id, { changes: data });
  return store;
}

export async function createStore(data: { name: string; userId: string; url?: string; industry?: string }) {
  await requireAdmin();
  const store = await prisma.store.create({
    data: {
      name: data.name,
      userId: data.userId,
      url: data.url || null,
      industry: data.industry || null,
    },
  });
  revalidatePath("/admin");
  await logAdminAction("create_store", "Store", store.id, { name: data.name });
  return store;
}

export async function deleteStore(id: string) {
  await requireAdmin();
  await prisma.store.delete({ where: { id } });
  revalidatePath("/admin");
  await logAdminAction("delete_store", "Store", id, {});
  return { success: true };
}

// ==================== PRODUCTS CRUD (Global) ====================

export async function getProducts(page = 1, limit = 20, search?: string, category?: string) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
  }
  if (category && category !== "all") {
    where.category = category;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, user: { select: { email: true } } } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateProduct(id: string, data: { name?: string; price?: number; description?: string; category?: string; stock?: number; isActive?: boolean }) {
  await requireAdmin();
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  revalidatePath("/admin");
  return product;
}

export async function createProduct(data: { name: string; price: number; storeId: string; description?: string; category?: string; stock?: number }) {
  await requireAdmin();
  const product = await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      storeId: data.storeId,
      description: data.description || null,
      category: data.category || null,
      stock: data.stock ?? 0,
    },
  });
  revalidatePath("/admin");
  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}

// ==================== SUBSCRIPTIONS CRUD ====================

export async function getSubscriptions(page = 1, limit = 20, planFilter?: string, statusFilter?: string) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where: any = {};
  if (planFilter && planFilter !== "all") where.plan = planFilter;
  if (statusFilter && statusFilter !== "all") where.status = statusFilter;

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  return { subscriptions, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateSubscription(id: string, data: { 
  plan?: string; 
  status?: string; 
  currentPeriodEnd?: string | Date;
}) {
  await requireAdmin();
  const updateData: any = {};

  if (data.plan !== undefined) updateData.plan = data.plan;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.currentPeriodEnd !== undefined) {
    updateData.currentPeriodEnd = new Date(data.currentPeriodEnd);
  }

  const sub = await prisma.subscription.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin");
  await logAdminAction("update_subscription", "Subscription", id, { changes: data });
  return sub;
}

export async function extendSubscription(id: string, days: number = 30) {
  await requireAdmin();

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) throw new Error("Subscription not found");

  const currentEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date();
  currentEnd.setDate(currentEnd.getDate() + days);

  const updated = await prisma.subscription.update({
    where: { id },
    data: { currentPeriodEnd: currentEnd },
  });

  await logAdminAction("extend_subscription", "Subscription", id, { days });
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");

  return updated;
}

export async function cancelSubscription(id: string, reason: string) {
  await requireAdmin();

  const updated = await prisma.subscription.update({
    where: { id },
    data: { status: "canceled" },
  });

  await logAdminAction("cancel_subscription", "Subscription", id, { reason });
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");

  return updated;
}

export async function deleteSubscription(id: string) {
  await requireAdmin();
  await prisma.subscription.delete({ where: { id } });
  await logAdminAction("delete_subscription", "Subscription", id, {});
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
  return { success: true };
}

export async function reportUsage(subscriptionId: string, quantity: number) {
  await requireAdmin();
  
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!sub?.stripeId) {
    throw new Error("No Stripe subscription found");
  }

  // In a real metered setup, you would get the subscription item ID.
  // For now we log the intent. Full metered implementation requires
  // storing `stripeSubscriptionItemId` on the Subscription model.
  await logAdminAction("report_usage", "Subscription", subscriptionId, { quantity });

  // TODO: When using metered prices, call:
  // await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, { quantity });

  return { success: true, message: `Logged ${quantity} units for manual review` };
}

// ==================== USER IMPERSONATION ====================

export async function impersonateUser(targetUserId: string) {
  await requireAdmin();

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, name: true, role: true, image: true },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  await logAdminAction("impersonate_user", "User", targetUserId, {
    targetEmail: targetUser.email,
  });

  // Call the API route which properly sets the httpOnly cookie
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/admin/impersonate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: targetUserId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to impersonate user");
  }

  return await res.json();
}

export async function stopImpersonation() {
  await requireAdmin();

  await logAdminAction("stop_impersonation", "User", "", {});

  const res = await fetch(`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/admin/stop-impersonation`, {
    method: "POST",
  });

  return await res.json();
}

// ==================== CONVERSATIONS ====================

export async function getConversations(page = 1, limit = 20, search?: string, resolved?: string) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" as const } },
      { customerEmail: { contains: search, mode: "insensitive" as const } },
    ];
  }
  if (resolved === "resolved") where.resolved = true;
  if (resolved === "unresolved") where.resolved = false;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return { conversations, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getConversationById(id: string) {
  await requireAdmin();
  return prisma.conversation.findUnique({
    where: { id },
    include: { store: { select: { id: true, name: true } } },
  });
}

export async function deleteConversation(id: string) {
  await requireAdmin();
  await prisma.conversation.delete({ where: { id } });
  await logAdminAction("delete_conversation", "Conversation", id, {});
  revalidatePath("/admin/conversations");
  revalidatePath("/admin");
  return { success: true };
}

// ==================== API KEYS ====================

export async function getApiKeys(page = 1, limit = 20) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const [keys, total] = await Promise.all([
    prisma.apiKey.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        store: { select: { id: true, name: true, user: { select: { email: true } } } },
      },
    }),
    prisma.apiKey.count(),
  ]);

  return { keys, total, page, totalPages: Math.ceil(total / limit) };
}

export async function createApiKey(data: { storeId: string; name: string; permissions?: string }) {
  await requireAdmin();

  const { randomBytes } = await import("crypto");
  const key = `cai_${randomBytes(32).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      storeId: data.storeId,
      name: data.name,
      key,
      permissions: data.permissions || "read",
    },
  });

  await logAdminAction("create_api_key", "ApiKey", apiKey.id, { name: data.name, storeId: data.storeId });
  revalidatePath("/admin/api-keys");
  revalidatePath("/admin");
  return apiKey;
}

export async function deleteApiKey(id: string) {
  await requireAdmin();
  await prisma.apiKey.delete({ where: { id } });
  await logAdminAction("delete_api_key", "ApiKey", id, {});
  revalidatePath("/admin/api-keys");
  revalidatePath("/admin");
  return { success: true };
}

// ==================== ADMIN ACTION LOGS ====================

export async function getAdminLogs(page = 1, limit = 30) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.adminActionLog.count(),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
}

export async function logAdminAction(action: string, target: string, targetId: string, details?: any) {
  try {
    const { requireAuth } = await import("@/lib/auth");
    const admin = await requireAuth();
    await prisma.adminActionLog.create({
      data: {
        adminId: admin.id,
        action,
        target,
        targetId,
        details: details || {},
      },
    });
  } catch {
    // Silently fail for logging
  }
}

// ==================== PLATFORM STATS ====================

export async function getPlatformStats() {
  await requireAdmin();

  const [
    totalUsers,
    totalStores,
    totalProducts,
    totalConversations,
    activeSubscriptions,
    recentUsers,
    recentConversations,
    usageAggregate,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.conversation.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, createdAt: true } }),
    prisma.conversation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true } } },
    }),
    prisma.usageLog.aggregate({ _sum: { messagesCount: true } }),
  ]);

  const planDistribution = await prisma.subscription.groupBy({
    by: ["plan"],
    _count: true,
  });

  const storeStatusDistribution = await prisma.store.groupBy({
    by: ["status"],
    _count: true,
  });

  return {
    totalUsers,
    totalStores,
    totalProducts,
    totalConversations,
    activeSubscriptions,
    totalMessages: usageAggregate._sum.messagesCount || 0,
    recentUsers,
    recentConversations,
    planDistribution,
    storeStatusDistribution,
  };
}