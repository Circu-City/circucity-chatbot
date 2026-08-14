"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { hashPassword, verifyPassword, createToken, SessionUser } from "@/lib/auth";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  name: z.string().max(200).optional(),
  plan: z.string().max(50).optional(),
});

export async function signUp(data: { email: string; password: string; name?: string; plan?: string }) {
  const parsed = signUpSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password, name, plan } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "customer" | "admin",
    image: user.image,
  };

  const token = createToken(session);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  // Create organization + workspace automatically
  const selectedPlan = (plan === "growth" || plan === "scale") ? plan : "free";
  const subStatus = selectedPlan === "free" ? "free" : "trialing";

  const slugBase = (name || "my-org").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const org = await prisma.organization.create({
    data: {
      userId: user.id,
      name: (name || "My Organization") + "'s Org",
      slug: slugBase + "-" + user.id.slice(-6),
      plan: selectedPlan,
      workspaces: {
        create: {
          userId: user.id,
          name: (name ? name + " Workspace" : "Default Workspace"),
          businessName: name || "",
          subscriptions: {
            create: { plan: selectedPlan, status: subStatus },
          },
          embedSettings: { create: {} },
        },
      },
    },
  });

  return { success: true };
}

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signIn(data: { email: string; password: string }) {
  const parsed = signInSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return { error: "Invalid credentials" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid credentials" };
  }

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "customer" | "admin",
    image: user.image,
  };

  const token = createToken(session);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return { success: true, user: session };
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { maxAge: 0, path: "/" });
  redirect("/");
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const { verifyToken } = await import("@/lib/auth");
  return verifyToken(token);
}