import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  corsHeadersFor,
  findActiveStoreByApiKey,
} from "@/lib/widget-api";
import { signWidgetSessionToken, WIDGET_SESSION_TTL_SECONDS } from "@/lib/widget-session";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const h = () => corsHeadersFor(request.headers.get("origin"));
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: h() });
    }

    const { apiKey, sessionId } = body || {};
    const store = await findActiveStoreByApiKey(apiKey);
    if (!store) {
      return NextResponse.json(
        { error: "Invalid API key or inactive workspace" },
        { status: 401, headers: h() },
      );
    }

    if (!checkRateLimit(`session:${store.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: h() });
    }

    const sid =
      typeof sessionId === "string" && sessionId ? sessionId.slice(0, 100) : "visitor";
    const token = signWidgetSessionToken(store.id, sid, origin);

    return NextResponse.json(
      { success: true, token, expiresIn: WIDGET_SESSION_TTL_SECONDS },
      { headers: h() },
    );
  } catch (e: any) {
    console.error("Session error:", e);
    return NextResponse.json({ error: "Session failed" }, { status: 500, headers: h() });
  }
}
