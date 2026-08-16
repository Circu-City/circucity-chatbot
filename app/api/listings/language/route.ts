import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { LISTING_LANGUAGES } from "@/lib/listing-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const languageSchema = z.object({ language: z.string().trim().min(2).max(40) });

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { listingLanguage: true } });
    return NextResponse.json({ success: true, language: user?.listingLanguage || "sv" });
  } catch (e: any) {
    const status = e?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Internal error" }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const parsed = languageSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "language is required" }, { status: 400 });
    const language = parsed.data.language;
    if (!LISTING_LANGUAGES[language]) {
      return NextResponse.json({ error: "Unsupported language. Use one of: sv, en, nl, de, fi, fr, es, it, da, no" }, { status: 400 });
    }
    await prisma.user.update({ where: { id: session.id }, data: { listingLanguage: language } });
    return NextResponse.json({ success: true, language });
  } catch (e: any) {
    const status = e?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Internal error" }, { status });
  }
}
