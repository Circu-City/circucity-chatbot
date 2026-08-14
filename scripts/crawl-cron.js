/**
 * Website Crawler Cron Script
 *
 * Run via PM2 cron or system cron:
 *   node scripts/crawl-cron.js
 *
 * PM2 ecosystem:
 *   { name: "crawl-cron", script: "scripts/crawl-cron.js", cron_restart: "0 */6 * * *" }
 */

const BASE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

async function runCrawl() {
  console.log(`[CrawlCron] Starting scheduled crawl at ${new Date().toISOString()}`);
  console.log(`[CrawlCron] Base URL: ${BASE_URL}`);

  try {
    const { prisma } = await import("../lib/db");
    const { crawlWebsite } = await import("../lib/crawler");

    const workspaces = await prisma.store.findMany({
      where: {
        websiteUrl: { not: null },
        status: "active",
      },
      select: { id: true, name: true, websiteUrl: true, lastCrawl: true },
    });

    console.log(`[CrawlCron] Found ${workspaces.length} workspaces with website URLs`);

    for (const ws of workspaces) {
      try {
        const hoursSinceLastCrawl = ws.lastCrawl
          ? (Date.now() - new Date(ws.lastCrawl).getTime()) / (1000 * 60 * 60)
          : Infinity;

        if (hoursSinceLastCrawl < 6) {
          console.log(`[CrawlCron] Skipping ${ws.name} - crawled ${Math.round(hoursSinceLastCrawl)}h ago`);
          continue;
        }

        console.log(`[CrawlCron] Crawling workspace: ${ws.name} (${ws.websiteUrl})`);
        await crawlWebsite(ws.id);
        console.log(`[CrawlCron] Done: ${ws.name}`);
      } catch (e: any) {
        console.error(`[CrawlCron] Error crawling ${ws.name}:`, e.message);
      }
    }

    console.log(`[CrawlCron] Scheduled crawl complete`);
  } catch (error: any) {
    console.error(`[CrawlCron] Fatal error:`, error.message);
    process.exit(1);
  }
}

runCrawl();
