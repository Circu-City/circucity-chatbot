import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
export async function GET(req, { params }) {
  const id = (await params).id;
  const job = await prisma.jobPosting.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: job });
}