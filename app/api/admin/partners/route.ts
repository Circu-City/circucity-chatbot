import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const SYNC_SECRET = process.env.PARTNERS_SYNC_SECRET || "";
const API = process.env.PARTNERS_URL || "http://127.0.0.1:3006";
const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";

export async function GET() {
  const u = await requireAuth();
  if (u.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  const headers = { "x-sync-secret": SYNC_SECRET };
  const [partners, leads, kpis, tasks] = await Promise.all([
    fetch(API + "/api/sync/partners", { headers }).then(r => r.json()).catch(() => ({ partners: [] })),
    fetch(API + "/api/sync/leads", { headers }).then(r => r.json()).catch(() => ({ leads: [] })),
    fetch(API + "/api/sync/kpis", { headers }).then(r => r.json()).catch(() => ({})),
    fetch(API + "/api/sync/tasks", { headers }).then(r => r.json()).catch(() => ({ tasks: [] })),
  ]);
  return NextResponse.json({
    success: true,
    data: {
      partners: partners.partners || [],
      leads: leads.leads || [],
      kpis,
      tasks: tasks.tasks || [],
    },
  });
}

export async function POST(req: NextRequest) {
  const u = await requireAuth();
  if (u.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { name, email } = body;
  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  const res = await fetch(API + "/api/sync/approved-partner", {
    method: "POST",
    headers: { "x-sync-secret": SYNC_SECRET, "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, program: "affiliate" }),
  }).then(r => r.json()).catch(() => ({ error: "CRM unavailable" }));
  if (res.error) return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ success: true, setupUrl: res.setupUrl || "", link: BASE_URL });
}
