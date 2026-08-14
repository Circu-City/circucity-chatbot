import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, SessionUser } from "@/lib/auth";

async function adminOnly(): Promise<SessionUser | NextResponse> {
  try {
    const u = await requireAuth();
    if (u.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    return u;
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET() {
  const auth = await adminOnly();
  if (auth instanceof NextResponse) return auth;
  const apps = await prisma.jobApplication.findMany({ orderBy: { createdAt: "desc" }, include: { job: { select: { title: true, department: true } } } });
  return NextResponse.json({ success: true, data: apps });
}
