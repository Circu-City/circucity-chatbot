import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/db";
import { hashPassword, createToken, SessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  name: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        passwordHash,
      },
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
      maxAge: 7 * 24 * 60 * 60, // 7 days matching JWT 7d
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: session,
    });
  } catch (error: any) {
    console.error("[Gavriel Sign Up] Error:", error);
    return NextResponse.json({ error: "An error occurred while creating your account. Please try again." }, { status: 500 });
  }
}
