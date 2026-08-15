import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { assertListingQuota } from "@/lib/listing";
import { analyzeListingImage } from "@/lib/listing-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const quota = await assertListingQuota(session.id);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = await analyzeListingImage(body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });


    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const record = await prisma.listingRecord.create({
      data: {
        storeId: store.id,
        userId: session.id,
        platform: "draft",
        status: "ready",
        title: result.data.title,
        listingJson: JSON.stringify(result.data.rawResponse),
      },
    });

    return NextResponse.json({
      ...result.data,
      listingId: record.id,
      quota,
    });
  } catch (e: any) {
    const status = e?.message === "Unauthorized" ? 401 : typeof e?.status === "number" ? e.status : 500;
    return NextResponse.json({ error: e?.message || "Internal error" }, { status });
  }
}