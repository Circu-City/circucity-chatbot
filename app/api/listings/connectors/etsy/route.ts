import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_BASE = process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com";
const CALLBACK = `${APP_BASE}/api/listings/connectors/etsy/callback`;
const SCOPES = "listings:w shops:r";

export async function POST() {
  try {
    const session = await requireAuth();
    const apiKey = process.env.ETSY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "The Etsy app key is not configured on this server yet. Add ETSY_API_KEY to enable Etsy publishing." },
        { status: 400 },
      );
    }

    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // Etsy requires PKCE on every OAuth flow — store the verifier on the
    // pending channel row so the callback can redeem the code.
    const codeVerifier = randomBytes(48).toString("base64url");
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

    await prisma.channel.upsert({
      where: { storeId_type: { storeId: store.id, type: "etsy" } },
      create: {
        storeId: store.id,
        type: "etsy",
        name: "Etsy",
        status: "pending",
        credentials: JSON.stringify({ codeVerifier }),
      },
      update: {
        status: "pending",
        credentials: JSON.stringify({ codeVerifier }),
        errorMessage: null,
      },
    });

    const params = new URLSearchParams({
      client_id: apiKey,
      redirect_uri: CALLBACK,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state: store.id,
    });

    return NextResponse.json({ success: true, data: { url: `https://www.etsy.com/oauth/connect?${params.toString()}` } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unauthorized" }, { status: 401 });
  }
}