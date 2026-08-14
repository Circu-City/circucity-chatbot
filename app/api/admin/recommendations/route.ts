import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || undefined;

    const where = storeId ? { id: storeId } : {};
    const stores = await prisma.store.findMany({
      where,
      select: {
        id: true, name: true, businessName: true, websiteUrl: true,
        aboutBusiness: true, contactInfo: true, operatingHours: true,
        crawlData: true, _count: { select: { products: true, conversations: true } },
      },
    });

    const recommendations: any[] = [];

    for (const store of stores) {
      const storeName = store.businessName || store.name;
      const recs: any[] = [];
      let crawl: any = {};
      if (store.crawlData) { try { crawl = JSON.parse(store.crawlData); } catch {} }

      // 1. Missing pages
      const missingPages: string[] = [];
      if (!store.aboutBusiness && !crawl.pages?.some((p: any) => p.title?.toLowerCase().includes("about"))) {
        missingPages.push("About Us");
      }
      if (!store.contactInfo && !crawl.pages?.some((p: any) => p.title?.toLowerCase().includes("contact"))) {
        missingPages.push("Contact");
      }
      if (!crawl.pages?.some((p: any) => p.title?.toLowerCase().includes("faq") || p.title?.toLowerCase().includes("help"))) {
        missingPages.push("FAQ / Help");
      }
      if (missingPages.length > 0) {
        recs.push({
          type: "content",
          severity: "medium",
          title: "Missing Key Pages",
          description: storeName + " is missing: " + missingPages.join(", ") + ". Adding these improves SEO and customer trust.",
          action: "Add these pages to the website",
        });
      }

      // 2. Unanswered questions indicate content gaps
      if (crawl.unanswered?.length > 0) {
        const topUnanswered = crawl.unanswered.slice(0, 3).map((u: any) => u.question);
        recs.push({
          type: "knowledge",
          severity: crawl.unanswered.length > 10 ? "high" : "medium",
          title: crawl.unanswered.length + " Unanswered Questions",
          description: "Customers are asking about: " + topUnanswered.join("; ") + ". Adding these to the FAQ would improve the bot's helpfulness.",
          action: "Review unanswered questions and add to FAQ",
        });
      }

      // 3. No products
      if (store._count.products === 0) {
        recs.push({
          type: "catalog",
          severity: "high",
          title: "Empty Product Catalog",
          description: storeName + " has no products. The bot cannot recommend or sell anything.",
          action: "Add products via the dashboard or sync from your e-commerce platform",
        });
      }

      // 4. Missing business info
      if (!store.aboutBusiness) {
        recs.push({
          type: "content",
          severity: "low",
          title: "Missing Business Description",
          description: "Adding a business description helps the bot answer 'what does your company do?' questions accurately.",
          action: "Add a brief 'About Business' description in workspace settings",
        });
      }

      // 5. Website not set
      if (!store.websiteUrl) {
        recs.push({
          type: "setup",
          severity: "high",
          title: "Website URL Not Configured",
          description: storeName + " has no website URL set. The bot cannot crawl pages or fetch live content.",
          action: "Set the website URL in workspace settings",
        });
      }

      // 6. Low product count
      if (store._count.products > 0 && store._count.products < 5) {
        recs.push({
          type: "catalog",
          severity: "low",
          title: "Small Product Catalog (" + store._count.products + " products)",
          description: "A larger catalog gives customers more to discover. Consider adding more products.",
          action: "Add more products to increase discovery",
        });
      }

      recommendations.push({
        storeId: store.id,
        storeName,
        recommendations: recs,
        score: {
          total: recs.length,
          high: recs.filter((r: any) => r.severity === "high").length,
          medium: recs.filter((r: any) => r.severity === "medium").length,
          low: recs.filter((r: any) => r.severity === "low").length,
        },
      });
    }

    // Sort by severity (high issues first)
    recommendations.sort((a, b) => (b.score.high * 3 + b.score.medium * 2 + b.score.low) - (a.score.high * 3 + a.score.medium * 2 + a.score.low));

    return NextResponse.json({ success: true, data: recommendations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
