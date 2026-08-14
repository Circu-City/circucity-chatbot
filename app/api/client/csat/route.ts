import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  checkRateLimit,
  corsHeadersFor,
  findActiveStoreByApiKey,
  trackWidgetEvent,
} from "@/lib/widget-api";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const h = () => corsHeadersFor(origin);
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: h() });
    }

    const { apiKey, sessionId, rating, comment, kind, question, answer } = body || {};
    const score = Number(rating);
    if (!sessionId || !Number.isFinite(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: "Invalid rating (1-5) or sessionId" },
        { status: 400, headers: h() },
      );
    }

    const store = await findActiveStoreByApiKey(apiKey);
    if (!store) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: h() });
    }

    if (!checkRateLimit(`csat:${store.id}:${sessionId}`, 10, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: h() });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { sessionId },
    });
    if (!conversation || conversation.storeId !== store.id) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404, headers: h() },
      );
    }

    const rounded = Math.round(score);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        rating: rounded,
        ratingComment:
          typeof comment === "string" ? comment.slice(0, 500) : conversation.ratingComment,
        ratedAt: new Date(),
        resolved: rounded >= 4 ? true : conversation.resolved,
      },
    });

    await trackWidgetEvent(store.id, kind === "thumbs" ? "csat_thumbs" : "csat_rating", sessionId, {
      rating: rounded,
      comment: typeof comment === "string" ? comment.slice(0, 200) : undefined,
    });

    // A thumbs-down is a much stronger, human-confirmed signal than the
    // keyword-based "unanswered" heuristic elsewhere — feed it into the same
    // crawlData.unanswered list the merchant's "Unanswered" dashboard page
    // already reads from, so a bad answer becomes something they can actually
    // act on (generate a better answer / add it as a real FAQ).
    if (kind === "thumbs" && rounded === 1 && typeof question === "string" && question.trim()) {
      try {
        let crawl: any = {};
        if (store.crawlData) {
          try {
            crawl = JSON.parse(store.crawlData);
          } catch {
            crawl = {};
          }
        }
        if (!Array.isArray(crawl.unanswered)) crawl.unanswered = [];
        crawl.unanswered.push({
          question: question.trim().slice(0, 500),
          reply: typeof answer === "string" ? answer.slice(0, 500) : "",
          timestamp: new Date().toISOString(),
          source: "thumbs_down",
        });
        if (crawl.unanswered.length > 100) {
          crawl.unanswered = crawl.unanswered.slice(-100);
        }
        await prisma.store.update({
          where: { id: store.id },
          data: { crawlData: JSON.stringify(crawl) },
        });
      } catch (e) {
        console.error("Failed to record thumbs-down as unanswered:", e);
      }
    }

    return NextResponse.json({ ok: true, rating: rounded }, { headers: h() });
  } catch (error: any) {
    console.error("CSAT error:", error);
    return NextResponse.json({ error: "CSAT failed" }, { status: 500, headers: h() });
  }
}
