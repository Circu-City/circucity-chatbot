import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getSession, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pricePricingSchema = z.object({
  currency: z.string().max(10).optional().default("EUR"),
  fastLiquidationPrice: z.number().optional(),
  optimalMarginPrice: z.number().optional(),
  premiumValuationPrice: z.number().optional(),
  suggestedRange: z.string().max(50).optional(),
  marketRationale: z.string().max(1000).optional(),
}).optional();

const analysisSchema = z.object({
  productName: z.string().min(1).max(250),
  brand: z.string().max(100).optional().default("Authentic"),
  categoryHierarchy: z.string().max(250).optional().default("General Goods"),
  primaryCategory: z.string().max(100).optional().default("General"),
  conditionGrading: z.string().max(250).optional().default("Very Good"),
  defectReport: z.string().max(500).optional().default("None"),
  materials: z.string().max(250).optional().default("Standard"),
  estimatedDimensions: z.string().max(200).optional().default("Standard"),
  pricePricing: pricePricingSchema,
  confidenceScore: z.number().optional().default(90),
  keyFeatures: z.array(z.string().max(300)).max(10).optional().default([]),
  searchKeywords: z.array(z.string().max(100)).max(20).optional().default([]),
});

const inputSchema = z.object({
  analysis: analysisSchema,
  marketplaces: z.array(z.string().max(50)).min(1).max(10),
  tone: z.enum(["professional", "luxury", "casual", "trendy"]).optional().default("professional"),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1",
});

// Helper to sanitize strings to prevent prompt injection or control escape sequences
function sanitizeText(str: string): string {
  if (!str) return "";
  return str
    .replace(/[<>{}\\]/g, "")
    .replace(/\b(system|assistant|user|developer):\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    // 1. Auth check
    let session = await getSession();
    if (!session) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        session = verifyToken(authHeader.substring(7));
      }
    }

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required to generate multi-channel listing copy." },
        { status: 401 }
      );
    }

    // 2. Input validation
    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input data structure" },
        { status: 400 }
      );
    }

    const { analysis, marketplaces, tone } = parsed.data;

    // 3. Sanitized fields
    const safeTitle = sanitizeText(analysis.productName);
    const safeBrand = sanitizeText(analysis.brand || "Unspecified Brand");
    const safeCategory = sanitizeText(analysis.categoryHierarchy || analysis.primaryCategory || "General");
    const safeCondition = sanitizeText(analysis.conditionGrading || "Good Pre-owned");
    const safeDefects = sanitizeText(analysis.defectReport || "No major defects");
    const safeMaterials = sanitizeText(analysis.materials || "High-grade materials");
    const safeDimensions = sanitizeText(analysis.estimatedDimensions || "Standard");
    const safePrice = analysis.pricePricing?.optimalMarginPrice ?? 50;
    const safeCurrency = sanitizeText(analysis.pricePricing?.currency || "EUR");
    const safeFeatures = (analysis.keyFeatures || []).map(f => sanitizeText(f)).filter(Boolean);
    const safeKeywords = (analysis.searchKeywords || []).map(k => sanitizeText(k)).filter(Boolean);

    const prompt = `You are Gavriel Native Listing Core 2.0, CircuCity's high-conversion e-commerce copywriting and multi-channel SEO engine.
Generate platform-native listing copy for targeted marketplaces: ${marketplaces.join(", ")}.

Product Intelligence:
- Title: ${safeTitle}
- Brand: ${safeBrand}
- Category: ${safeCategory}
- Condition Grading: ${safeCondition}
- Defects / Wear Report: ${safeDefects}
- Inferred Materials: ${safeMaterials}
- Dimensions: ${safeDimensions}
- Optimal Listing Price: ${safePrice} ${safeCurrency}
- Key Verified Features: ${safeFeatures.join("; ")}
- Target Keywords: ${safeKeywords.join(", ")}
- Target Copywriting Tone: ${tone}

Output a strict JSON object containing keys for each requested channel:
- shopify: { "title": string, "htmlDescription": string, "metaTitle": string, "metaDescription": string, "tags": string[], "skuSuggestion": string }
- amazon: { "title": string (max 200 chars), "bulletPoints": string[] (5 distinct points), "backendSearchTerms": string }
- ebay: { "title": string (max 80 chars), "subtitle": string, "itemSpecifics": Record<string, string>, "htmlTemplate": string }
- etsy: { "title": string, "description": string, "tags13": string[] (max 13 tags), "materials": string }
- tiktok: { "hookTitle": string, "caption": string, "callToAction": string }

Respond ONLY with valid JSON conforming to the requested channels. Do not include markdown code ticks.`;

    const response = await client.chat.completions.create({
      model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an elite e-commerce copywriter and SEO engineer. Generate pristine, conversion-optimized copy strictly formatted in JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Copy generation model returned an empty response." },
        { status: 502 }
      );
    }

    const cleanJsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const copyData = JSON.parse(cleanJsonStr);

    return NextResponse.json({
      success: true,
      copy: copyData,
    });
  } catch (error: any) {
    console.error("[Gavriel Generate Copy] Error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while generating multi-channel listing copy." },
      { status: 500 }
    );
  }
}
