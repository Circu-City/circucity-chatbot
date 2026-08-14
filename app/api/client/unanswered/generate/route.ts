import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const store = await prisma.store.findFirst({ where: { userId: session.id }, select: { id: true, businessName: true, crawlData: true } });
    if (!store) return NextResponse.json({ success: false, error: "No store found" }, { status: 404 });

    const body = await request.json();
    const question = body.question as string;
    if (!question) return NextResponse.json({ success: false, error: "Question is required" }, { status: 400 });

    if (!openai) return NextResponse.json({ success: false, error: "AI not configured" }, { status: 503 });

    const storeName = store.businessName || "the store";

    const completion = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "groq/llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful FAQ writer for " + storeName + ". Generate a concise, friendly FAQ answer. Respond with ONLY the answer text, no extra formatting." },
        { role: "user", content: "Write a helpful FAQ answer for the question: " + question },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || "Thank you for your question. Please contact our support team for more details.";

    let crawl: any = {};
    if (store.crawlData) { try { crawl = JSON.parse(store.crawlData); } catch {} }
    if (!crawl.faqs) crawl.faqs = [];
    crawl.faqs.push({ question, answer, addedAt: new Date().toISOString(), generated: true });
    const unanswered: any[] = crawl.unanswered || [];
    const idx = unanswered.findIndex((u: any) => u.question === question);
    if (idx !== -1) unanswered.splice(idx, 1);
    crawl.unanswered = unanswered;
    await prisma.store.update({ where: { id: store.id }, data: { crawlData: JSON.stringify(crawl) } });

    return NextResponse.json({ success: true, data: { question, answer } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
}
