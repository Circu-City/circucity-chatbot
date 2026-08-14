import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const API = "http://127.0.0.1:3006/api";

export async function GET() {
  const u = await requireAuth();
  if (u.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  const login = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@circucity.com", password: "CircuCity2024!" }) }).then(r => r.json());
  if (!login.token) return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  const [partners, leads, kpis] = await Promise.all([
    fetch(API + "/admin/partners", { headers: { "Authorization": "Bearer " + login.token } }).then(r => r.json()),
    fetch(API + "/admin/leads", { headers: { "Authorization": "Bearer " + login.token } }).then(r => r.json()),
    fetch(API + "/admin/kpis", { headers: { "Authorization": "Bearer " + login.token } }).then(r => r.json()),
  ]);
  return NextResponse.json({ success: true, data: { partners: partners.partners || [], leads: leads.leads || [], kpis } });
}

export async function POST(req: NextRequest) {
  const u = await requireAuth();
  if (u.role !== "admin") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  const login = await fetch(API + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@circucity.com", password: "CircuCity2024!" }) }).then(r => r.json());
  if (!login.token) return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  const body = await req.json();
  const res = await fetch(API + "/auth/register", { method: "POST", headers: { "Authorization": "Bearer " + login.token, "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
  return NextResponse.json(res);
}
