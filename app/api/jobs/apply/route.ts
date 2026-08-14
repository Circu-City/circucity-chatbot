import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/email";
export async function POST(req) {
  try {
    const b = await req.json();
    if (!b.jobId || !b.firstName || !b.lastName || !b.email)
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    const job = await prisma.jobPosting.findUnique({ where: { id: b.jobId } });
    if (!job || job.status !== "open")
      return NextResponse.json({ success: false, error: "Job closed" }, { status: 404 });
    let score = 50;
    if (b.coverLetter && job.vettingRules) {
      try { JSON.parse(job.vettingRules).forEach(k => { if (b.coverLetter.toLowerCase().includes(k.toLowerCase())) score += 10; }); } catch {}
    }
    const app = await prisma.jobApplication.create({
      data: { jobId: b.jobId, firstName: b.firstName, lastName: b.lastName, email: b.email, phone: b.phone, resumeUrl: b.resumeUrl, coverLetter: b.coverLetter, answers: b.answers, score: Math.min(score, 100), status: score >= 70 ? "shortlisted" : "pending" },
    });
    sendEmail({ to: b.email, subject: "Application Received", text: "Hi " + b.firstName + ",\n\nThank you for applying to " + job.title + " at CircuCity AI. We have received your application and will review it shortly.\n\nBest regards,\nCircuCity AI Team" }).catch(() => {});
    return NextResponse.json({ success: true, data: { id: app.id, status: app.status } });
  } catch (e) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}