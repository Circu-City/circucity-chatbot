import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { crawlWebsite } from "@/lib/crawler";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    const workspace = await prisma.store.findFirst({
      where: { apiKey },
      select: { id: true, name: true, websiteUrl: true, crawlStatus: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!workspace.websiteUrl) {
      return NextResponse.json({ error: "No website URL configured for this workspace" }, { status: 400 });
    }

    // Run crawl asynchronously (don't await - fire and forget)
    crawlWebsite(workspace.id).catch((e) => console.error("Crawl error:", e));

    return NextResponse.json({
      status: "started",
      message: "Website crawl initiated",
      workspaceId: workspace.id,
    });
  } catch (error: any) {
    console.error("Crawl API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
