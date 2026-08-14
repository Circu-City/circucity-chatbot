"use server";
import { crawlWebsite } from '@/lib/crawler';

import prisma from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCurrentOrganization() {
  const session = await requireAuth();
  return prisma.organization.findFirst({
    where: { userId: session.id },
    include: {
      workspaces: {
        include: {
          subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { products: true, conversations: true } },
        },
      },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}

export async function getOrganizationById(id: string) {
  const session = await requireAuth();
  const org = await prisma.organization.findFirst({
    where: { id, userId: session.id },
    include: {
      workspaces: {
        include: {
          subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
          embedSettings: true,
          _count: { select: { products: true, conversations: true, apiKeys: true } },
        },
      },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  return org;
}

export async function updateOrganization(id: string, data: { name?: string }) {
  const session = await requireAuth();
  const org = await prisma.organization.findFirst({ where: { id, userId: session.id } });
  if (!org) throw new Error("Organization not found");

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.name !== undefined && { slug: data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }),
    },
  });
  revalidatePath("/dashboard");
  return updated;
}

export async function createWorkspace(data: {
  orgId: string;
  name: string;
  websiteUrl?: string;
  businessName?: string;
  personality?: string;
  greetingMessage?: string;
}) {
  const session = await requireAuth();
  const org = await prisma.organization.findFirst({ where: { id: data.orgId, userId: session.id } });
  if (!org) throw new Error("Organization not found");

  const workspace = await prisma.store.create({
    data: {
      orgId: data.orgId,
      userId: session.id,
      name: data.name,
      websiteUrl: data.websiteUrl,
      businessName: data.businessName || org.name,
      personality: data.personality || "professional",
      greetingMessage: data.greetingMessage,
      subscriptions: { create: { plan: org.plan, status: org.plan === "free" ? "free" : "trialing" } },
      embedSettings: { create: {} },
    },
  });
  revalidatePath("/dashboard");
  return workspace;
}

export async function getWorkspaceById(id: string) {
  const session = await requireAuth();
  return prisma.store.findFirst({
    where: { id, userId: session.id },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      embedSettings: true,
      _count: { select: { products: true, conversations: true, apiKeys: true } },
    },
  });
}

export async function updateWorkspace(id: string, data: {
  name?: string;
  websiteUrl?: string;
  businessName?: string;
  aboutBusiness?: string;
  contactInfo?: string;
  operatingHours?: string;
  personality?: string;
  greetingMessage?: string;
  suggestedPrompts?: string;
  salesRules?: string;
  escalationRules?: string;
  leadCaptureSettings?: string;
  tone?: string;
  url?: string;
  industry?: string;
}) {
  const session = await requireAuth();
  const ws = await prisma.store.findFirst({ where: { id, userId: session.id } });
  if (!ws) throw new Error("Workspace not found");

  const updateData: any = {};
  const fields = [
    "name", "websiteUrl", "businessName", "aboutBusiness", "contactInfo",
    "operatingHours", "personality", "greetingMessage", "suggestedPrompts",
    "salesRules", "escalationRules", "leadCaptureSettings", "tone", "url", "industry",
  ];
  for (const field of fields) {
    if ((data as any)[field] !== undefined) {
      updateData[field] = (data as any)[field];
    }
  }

  // Keep websiteUrl and url in sync so crawl, live catalog, and live page fetch all work
  if (updateData.websiteUrl && !updateData.url) {
    updateData.url = updateData.websiteUrl;
  } else if (updateData.url && !updateData.websiteUrl) {
    const normalized = String(updateData.url).startsWith("http")
      ? updateData.url
      : `https://${String(updateData.url).replace(/^\/+/, "")}`;
    updateData.websiteUrl = normalized;
    updateData.url = normalized;
  }

  const updated = await prisma.store.update({ where: { id }, data: updateData });
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteWorkspace(id: string) {
  const session = await requireAuth();
  const ws = await prisma.store.findFirst({ where: { id, userId: session.id } });
  if (!ws) throw new Error("Workspace not found");
  await prisma.store.delete({ where: { id } });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function generateWorkspaceApiKey(workspaceId: string) {
  const session = await requireAuth();
  const ws = await prisma.store.findFirst({ where: { id: workspaceId, userId: session.id } });
  if (!ws) throw new Error("Workspace not found");

  const key = "cc_live_" + Array.from({ length: 32 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");

  await prisma.store.update({
    where: { id: workspaceId },
    data: { apiKey: key },
  });

  await prisma.apiKey.create({
    data: {
      storeId: workspaceId,
      key,
      name: "Default API Key",
      permissions: "read",
    },
  });

  revalidatePath("/dashboard");
  return { apiKey: key };
}

export async function triggerCrawl(workspaceId: string) {
  const session = await requireAuth();
  const ws = await prisma.store.findFirst({ where: { id: workspaceId, userId: session.id } });
  if (!ws) throw new Error("Workspace not found");
  if (!ws.websiteUrl) throw new Error("No website URL configured");
  if (!ws.ownershipVerified) throw new Error("Website ownership not verified. Install the widget code on your website first.");

  await prisma.store.update({
    where: { id: workspaceId },
    data: { crawlStatus: "crawling" },
  });

  // Run the actual crawl asynchronously
  crawlWebsite(workspaceId).catch((e) => console.error("Crawl error:", e));

  revalidatePath("/dashboard");
  return { success: true, message: "Crawl started" };
}

// ==================== ADMIN ORGANIZATION CRUD ====================

export async function adminCreateOrganization(data: { name: string; ownerEmail: string; plan?: string }) {
  await requireAdmin();
  const owner = await prisma.user.findUnique({ where: { email: data.ownerEmail } });
  if (!owner) throw new Error("Owner not found with that email");

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50),
      plan: (data.plan || "free") as any,
      ownerId: owner.id,
      members: { create: { userId: owner.id, role: "owner" } },
    },
  });
  revalidatePath("/admin/organizations");
  return org;
}

export async function adminGetOrganizations(page = 1, limit = 20, search?: string) {
  await requireAdmin();
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" as const } },
      { slug: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        workspaces: { select: { id: true, name: true, status: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.organization.count({ where }),
  ]);

  return { organizations, total, page, totalPages: Math.ceil(total / limit) };
}

export async function adminGetOrganizationById(id: string) {
  await requireAdmin();
  return prisma.organization.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      workspaces: {
        include: {
          subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { products: true, conversations: true, apiKeys: true } },
        },
      },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}

export async function adminUpdateOrganization(id: string, data: { name?: string; plan?: string; status?: string }) {
  await requireAdmin();
  const org = await prisma.organization.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.plan !== undefined && { plan: data.plan }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
  revalidatePath("/admin");
  return org;
}

export async function adminDeleteOrganization(id: string) {
  await requireAdmin();
  await prisma.organization.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}
