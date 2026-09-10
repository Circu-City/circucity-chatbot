import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import prisma from "@/lib/db";
import { verifyPassword, createToken, SessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password format" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
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
      maxAge: 7 * 24 * 60 * 60, // 7 days matching JWT 7d
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: session,
    });
  } catch (error: any) {
    console.error("[Gavriel Sign In] Error:", error);
    return NextResponse.json({ error: "An error occurred while signing in. Please try again." }, { status: 500 });
  }
}
