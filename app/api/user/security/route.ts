import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        emailVerified: !!user.emailVerifiedAt,
        twoFactorEnabled: user.twoFactorEnabled,
        hasBackupCodes: !!user.backupCodes,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { email } = body;
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== session.id) {
        return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
      }
      await prisma.user.update({ where: { id: session.id }, data: { email, emailVerifiedAt: null } });
      return NextResponse.json({ success: true, data: { email, emailVerified: false } });
    }
    return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
