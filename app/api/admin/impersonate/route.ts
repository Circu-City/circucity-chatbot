import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/db";
import { createImpersonationToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, image: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Create short-lived impersonation token
    const impersonationToken = createImpersonationToken({
      userId: targetUser.id,
      impersonatedBy: admin.id,
    });

    const response = NextResponse.json({
      success: true,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    });

    // Set impersonation cookie (httpOnly for security)
    response.cookies.set("impersonate", impersonationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 4 * 60 * 60, // 4 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
