import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { TOTP } from "otplib";
import QRCode from "qrcode";

export async function POST() {
  try {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    if (user.twoFactorEnabled) {
      return NextResponse.json({ success: false, error: "2FA already enabled" }, { status: 400 });
    }
    const totp = new TOTP();
    const secret = totp.generateSecret();
    const service = "CircuCity AI";
    const otpauth = totp.keyuri(user.email, service, secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 8).toUpperCase()
    );
    await prisma.user.update({
      where: { id: session.id },
      data: { totpSecret: secret, backupCodes: JSON.stringify(backupCodes) },
    });
    return NextResponse.json({ success: true, data: { secret, qrCode, backupCodes, otpauth } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
