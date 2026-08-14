import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  corsHeadersFor,
  findActiveStoreByApiKey,
  trackWidgetEvent,
} from "@/lib/widget-api";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const h = () => corsHeadersFor(origin);
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: h() });
    }

    const { apiKey, sessionId, event, data } = body || {};
    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "Missing event" }, { status: 400, headers: h() });
    }

    const store = await findActiveStoreByApiKey(apiKey);
    if (!store) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: h() });
    }

    if (!checkRateLimit(`track:${store.id}`, 120, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: h() });
    }

    await trackWidgetEvent(store.id, event, sessionId, data);
    return NextResponse.json({ ok: true }, { headers: h() });
  } catch (error: any) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Track failed" }, { status: 500, headers: h() });
  }
}
