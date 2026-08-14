import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { processStockAlertsForProduct } from "@/lib/stock-alerts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, productId, stock, secret } = body || {};

    if (secret !== process.env.STOCK_ALERT_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    if (!storeId || !productId) {
      return NextResponse.json({ error: "Missing storeId or productId" }, { status: 400, headers: corsHeaders });
    }

    const notified = await processStockAlertsForProduct(storeId, productId, stock);
    return NextResponse.json({
      success: true,
      notified: notified.length,
      alerts: notified.map((a) => ({ email: a.email, productName: a.productName })),
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Stock alert notify error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400, headers: corsHeaders });
  }

  const alerts = await prisma.stockAlert.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ alerts }, { headers: corsHeaders });
}