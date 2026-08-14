import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { TOTP } from "otplib";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { token } = await req.json();
    if (!token) return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || !user.totpSecret) {
      return NextResponse.json({ success: false, error: "2FA not initialized" }, { status: 400 });
    }
    const totp = new TOTP();
    const isValid = totp.check(token, user.totpSecret);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.id },
      data: { twoFactorEnabled: true },
    });
    return NextResponse.json({ success: true, data: { twoFactorEnabled: true } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
