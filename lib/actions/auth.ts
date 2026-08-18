"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { hashPassword, verifyPassword, createToken, createPasswordResetToken, verifyPasswordResetToken, SessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

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

  if (user.role !== "customer") {
    try {
      await prisma.staffActivity.create({
        data: { userId: user.id, action: "login", details: `${user.name || user.email} signed in` },
      });
    } catch {}
  }

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

const resetRequestSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});

export async function requestPasswordReset(data: { email: string }) {
  const parsed = resetRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.passwordHash) {
    return { success: true };
  }

  const token = createPasswordResetToken(user.id);
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const ok = await sendEmail({
    to: user.email,
    subject: "Reset your CircuCity AI password",
    text: `Hi${user.name ? " " + user.name : ""},

We received a request to reset your CircuCity AI password. Click the link below to choose a new one (valid for 30 minutes):

${resetUrl}

If you didn't request this, you can safely ignore this email.

- CircuCity AI`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2 style="color:#0A1428">Reset your password</h2><p style="color:#475569">We received a request to reset your CircuCity AI password. Click the button below to choose a new one (valid for 30 minutes).</p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#A3E635;color:#0A1428;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Reset password</a><p style="margin-top:20px;font-size:12px;color:#94a3b8">If you didn't request this, you can safely ignore this email.<br/>- CircuCity AI</p></div>`,
  });

  if (!ok) {
    return { error: "Failed to send reset email. Please try again later." };
  }
  return { success: true };
}

const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset link"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export async function resetPassword(data: { token: string; password: string }) {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const userId = verifyPasswordResetToken(parsed.data.token);
  if (!userId) {
    return { error: "Invalid or expired reset link. Please request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const { verifyToken } = await import("@/lib/auth");
  return verifyToken(token);
}