import { NextRequest, NextResponse } from "next/server";
import { corsHeadersFor, findActiveStoreByApiKey } from "@/lib/widget-api";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const h = () => ({
    ...corsHeadersFor(origin),
    "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
  });
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get("key") || "";

  const store = await findActiveStoreByApiKey(apiKey);
  if (!store) {
    return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401, headers: h() });
  }

  let faqs: { question: string; answer: string }[] = [];
  if (store.crawlData) {
    try {
      const parsed = JSON.parse(store.crawlData);
      faqs = Array.isArray(parsed.faqs) ? parsed.faqs : [];
    } catch {}
  }

  return NextResponse.json({ success: true, data: faqs }, { headers: h() });
}
