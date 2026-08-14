import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { triggerFlow } from "@/lib/flows/engine";
import { corsHeadersFor } from "@/lib/widget-api";

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
    const { apiKey, event, data, sessionId } = await request.json();

    if (!apiKey || !event) {
      return NextResponse.json({ error: "apiKey and event required" }, { status: 400, headers: h() });
    }

    const store = await prisma.store.findFirst({
      where: { apiKey, status: { in: ["active", "trialing", "free"] } },
    });
    if (!store) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: h() });
    }

    const result = await triggerFlow(store.id, event, data, sessionId);

    if (result) {
      return NextResponse.json({
        success: true,
        messages: result.messages,
        executionId: result.executionId,
        hasWaits: result.hasWaits,
      }, { headers: h() });
    }

    return NextResponse.json({ success: true, messages: [] }, { headers: h() });
  } catch (e: any) {
    console.error("Flow trigger error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500, headers: h() });
  }
}
