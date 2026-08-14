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
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
  return NextResponse.json({ success: true, data: jobs });
}

export async function POST(req: NextRequest) {
  const auth = await adminOnly();
  if (auth instanceof NextResponse) return auth;
  const b = await req.json();
  if (!b.title || !b.department || !b.location || !b.description) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }
  const job = await prisma.jobPosting.create({
    data: {
      title: b.title,
      department: b.department,
      location: b.location,
      type: b.type || "full-time",
      description: b.description,
      requirements: b.requirements || null,
      expectations: b.expectations || null,
      salaryRange: b.salaryRange || null,
      vettingRules: b.vettingRules || null,
      screeningQuestions: b.screeningQuestions || null,
    },
  });
  return NextResponse.json({ success: true, data: job });
}

export async function PATCH(req: NextRequest) {
  const auth = await adminOnly();
  if (auth instanceof NextResponse) return auth;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  const data: any = {};
  if (b.title !== undefined) data.title = b.title;
  if (b.department !== undefined) data.department = b.department;
  if (b.location !== undefined) data.location = b.location;
  if (b.type !== undefined) data.type = b.type;
  if (b.description !== undefined) data.description = b.description;
  if (b.requirements !== undefined) data.requirements = b.requirements;
  if (b.expectations !== undefined) data.expectations = b.expectations;
  if (b.salaryRange !== undefined) data.salaryRange = b.salaryRange;
  if (b.vettingRules !== undefined) data.vettingRules = b.vettingRules;
  if (b.screeningQuestions !== undefined) data.screeningQuestions = b.screeningQuestions;
  if (b.status !== undefined) data.status = b.status;
  const job = await prisma.jobPosting.update({ where: { id: b.id }, data });
  return NextResponse.json({ success: true, data: job });
}

export async function DELETE(req: NextRequest) {
  const auth = await adminOnly();
  if (auth instanceof NextResponse) return auth;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  await prisma.jobPosting.delete({ where: { id: b.id } });
  return NextResponse.json({ success: true });
}
