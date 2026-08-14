import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
export async function GET() {
  const jobs = await prisma.jobPosting.findMany({ where: { status: "open" }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data: jobs });
}