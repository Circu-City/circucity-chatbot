import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { corsHeadersFor } from "@/lib/widget-api";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

function isValidKey(key: string): boolean {
  return /^cc_(live|demo)_[A-Za-z0-9_-]{10,}$/.test(key);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const h = () => corsHeadersFor(origin);
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";
  if (!key || !isValidKey(key))
    return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 400, headers: h() });
  try {
    const store = await prisma.store.findFirst({
      where: { apiKey: key, status: { in: ["active", "trialing", "free"] } },
      include: { embedSettings: true },
    });
    if (!store)
      return NextResponse.json({ success: false, error: "Store not found" }, { status: 404, headers: h() });
    return NextResponse.json(
      {
        success: true,
        workspace: {
          id: store.id,
          businessName: store.businessName || store.name,
          greetingMessage: store.greetingMessage || store.embedSettings?.welcomeMessage || null,
          suggestedPrompts: store.suggestedPrompts || null,
          plan: store.plan,
        },
        embed: {
          botName: store.embedSettings?.botName || null,
          primaryColor: store.embedSettings?.primaryColor || null,
        },
      },
      { headers: h() },
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: h() });
  }
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
    const { api_key, workspace_id } = body || {};
    const key = typeof api_key === "string" ? api_key : "";
    if (!key || !isValidKey(key))
      return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401, headers: h() });

    const store = await prisma.store.findFirst({
      where: { apiKey: key, status: { in: ["active", "trialing", "free"] } },
      include: { embedSettings: true },
    });
    if (!store)
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404, headers: h() });

    return NextResponse.json(
      {
        success: true,
        workspace: {
          id: store.id,
          businessName: store.businessName || store.name,
          greetingMessage: store.greetingMessage || store.embedSettings?.welcomeMessage || null,
          suggestedPrompts: store.suggestedPrompts || null,
          plan: store.plan,
        },
        embed: {
          botName: store.embedSettings?.botName || null,
          primaryColor: store.embedSettings?.primaryColor || null,
        },
      },
      { headers: h() },
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: h() });
  }
}
