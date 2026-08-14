import { NextResponse } from "next/server";
import { crawlAllWorkspaces } from "@/lib/crawler";

export async function GET() {
  try {
    // Run crawl asynchronously - fire and forget
    crawlAllWorkspaces().catch((e) => console.error("Crawl cron error:", e));
    return NextResponse.json({ status: "started", message: "Crawl job triggered" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to start crawl", detail: error.message }, { status: 500 });
  }
}
