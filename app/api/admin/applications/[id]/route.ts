import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, SessionUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

async function adminOnly(): Promise<SessionUser | NextResponse> {
  try {
    const u = await requireAuth();
    if (u.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    return u;
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOnly();
  if (auth instanceof NextResponse) return auth;
  const id = (await params).id;
  const b = await req.json();
  const app = await prisma.jobApplication.findUnique({ where: { id }, include: { job: true } });
  if (!app) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const updated = await prisma.jobApplication.update({ where: { id }, data: { status: b.status || app.status, adminNotes: b.adminNotes ?? app.adminNotes, reviewedAt: new Date(), reviewedBy: auth.email } });
  if (b.status === "approved" || b.status === "rejected") {
    const title = b.status === "approved" ? "Application Approved - " + app.job.title : "Application Update - " + app.job.title;
    const msg = b.status === "approved" ? "Congratulations! Your application for " + app.job.title + " has been approved. We will contact you with next steps." : "Thank you for your interest in " + app.job.title + ". After careful review, we have decided to move forward with other candidates.";
    sendEmail({ to: app.email, subject: title, text: "Hi " + app.firstName + ",\n\n" + msg + "\n\nBest regards,\nCircuCity AI Team" }).catch(() => {});
  }
  return NextResponse.json({ success: true, data: updated });
}
