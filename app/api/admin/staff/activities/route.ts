import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await requireAuth();
  if (admin.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const userId = req.nextUrl.searchParams.get("userId");
  const activities = await prisma.staffActivity.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ success: true, activities });
}
