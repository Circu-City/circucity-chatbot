import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { crawlWebsite } from "@/lib/crawler";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id") || "";

  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing tenant_id" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const store = await prisma.store.findFirst({
      where: { apiKey: tenantId, status: "active" },
      include: { embedSettings: true },
    });

    // Auto-verify website ownership if widget is loaded from the store's domain
    if (store && !store.ownershipVerified && store.websiteUrl) {
      const referer = request.headers.get("referer") || request.headers.get("origin") || "";
      try {
        const storeOrigin = new URL(store.websiteUrl).origin;
        const requestOrigin = new URL(referer).origin;
        if (storeOrigin === requestOrigin) {
          await prisma.store.update({
            where: { id: store.id },
            data: { ownershipVerified: true, verifiedAt: new Date() },
          });
          console.log("[Widget/Bootstrap] Auto-verified ownership for " + store.name + " (" + storeOrigin + ")");
          crawlWebsite(store.id).catch((e) => console.error("Crawl error:", e));
        }
      } catch {}
    }

    const welcomeMessage =
      store?.greetingMessage ||
      store?.embedSettings?.welcomeMessage ||
      "Hi! How can I help you today?";

    return NextResponse.json(
      {
        welcome_message: welcomeMessage,
        chat_endpoint: "/chat",
      },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      {
        welcome_message: "Hi! How can I help you today?",
        chat_endpoint: "/chat",
      },
      { headers: corsHeaders }
    );
  }
}