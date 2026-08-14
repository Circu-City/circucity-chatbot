import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      const created = await prisma.platformSettings.create({ data: { id: "singleton" } });
      return NextResponse.json({ success: true, data: created });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { platformName, supportEmail, maintenanceMode, requireEmailVerification, maxStoresPerUser } = body;

    const settings = await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        platformName: platformName || "CircuCity AI",
        supportEmail: supportEmail || "hello@circucity.com",
        maintenanceMode: maintenanceMode ?? false,
        requireEmailVerification: requireEmailVerification ?? false,
        maxStoresPerUser: maxStoresPerUser || 5,
      },
      update: {
        platformName: platformName !== undefined ? platformName : undefined,
        supportEmail: supportEmail !== undefined ? supportEmail : undefined,
        maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : undefined,
        requireEmailVerification: requireEmailVerification !== undefined ? requireEmailVerification : undefined,
        maxStoresPerUser: maxStoresPerUser !== undefined ? maxStoresPerUser : undefined,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
