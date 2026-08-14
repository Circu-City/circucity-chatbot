import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const ragKey = process.env.RAG_API_KEY || "";
    const ragUrl = process.env.RAG_API_URL || "http://127.0.0.1:8000";
    const body = await request.json();
    const res = await fetch(`${ragUrl}/crawl/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ragKey },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
