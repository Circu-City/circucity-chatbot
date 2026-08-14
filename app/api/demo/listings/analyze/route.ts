import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Demo sandbox key (Gavriel Listing AI pitch environment). The production endpoint
// will use workspace API keys + Stripe metering; this demo keeps a fixed key
// and per-visitor caps so a public link cannot burn the AI budget.
const DEMO_API_KEY = process.env.LISTING_DEMO_API_KEY || 'cc_listing_demo_ec9f2b1a7d84';
const KEY_DAILY_CAP = 50;
const IP_DAILY_CAP = 25;
const MAX_INFLIGHT = 4;

const usage = new Map<string, { date: string; count: number }>();
const inflightById = new Map<string, number>();
let inflight = 0;

function track(key: string): { used: number; limit: number } {
  const today = new Date().toISOString().slice(0, 10);
  // Prune stale entries so the map cannot grow unboundedly with unique visitors.
  if (usage.size > 500) {
    for (const [k, entry] of usage) {
      if (entry.date !== today) usage.delete(k);
    }
  }
  const entry = usage.get(key);
  if (!entry || entry.date !== today) {
    usage.set(key, { date: today, count: 1 });
    return { used: 1, limit: IP_DAILY_CAP };
  }
  entry.count += 1;
  return { used: entry.count, limit: IP_DAILY_CAP };
}

const requestSchema = z.object({
  imageDataUrl: z.string().max(8_000_000).optional(),
  titleHint: z.string().trim().max(120).optional().default(''),
}).refine((value) => value.imageDataUrl || value.titleHint, { message: 'Add a product photo or title' });

const analysisSchema = z.object({
  category: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  suggested_price_sek: z.coerce.number().int().positive().max(1_000_000),
  estimated_age: z.coerce.string().trim().max(80).optional().default('Unknown'),
  estimated_weight_kg: z.coerce.number().positive().max(200).optional().default(0.5),
  quantity: z.coerce.number().int().min(1).max(9999).optional().default(1),
  // Gemini doesn't reliably return an object here — sometimes it flattens everything
  // into one "Key: value, Key2: value2" string. Normalize before validating rather
  // than trusting the prompt instruction, or a well-formed result gets thrown away.
  attributes: z.preprocess((val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) return val;
    if (typeof val === 'string') {
      const result: Record<string, string> = {};
      // Split only on commas that start a new "Key:" pair, so multi-value fields
      // like "Features: Reusable, Eco-friendly" stay together under one key.
      val.split(/,\s*(?=[^,:]+:)/).forEach((pair) => {
        const idx = pair.indexOf(':');
        if (idx > -1) {
          const key = pair.slice(0, idx).trim();
          const value = pair.slice(idx + 1).trim();
          if (key) result[key] = value;
        }
      });
      return result;
    }
    return {};
  }, z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number(), z.boolean()]))]),
  )).optional().default({}),
  // True only when the price/description were checked against real search results
  // (currently only the Gemini + Google Search tier can set this).
  grounded: z.boolean().optional().default(false),
});
type Analysis = z.infer<typeof analysisSchema>;

// CircuCity marketplace taxonomy — the category values the platform accepts.
const MARKETPLACE_CATEGORIES = [
  'Bag',
  'Eco Home',
  'Electronics',
  'General',
  'Green Gadgets',
  'Recycled Items',
  'Skincare',
  'Sustainable Fashion',
];

function normalizeCategory(raw: unknown): string {
  if (typeof raw !== 'string') return 'General';
  const lowered = raw.trim().toLowerCase();
  const match = MARKETPLACE_CATEGORIES.find(
    (c) => lowered === c.toLowerCase() || lowered.startsWith(c.toLowerCase() + ' ') || lowered.includes(c.toLowerCase()),
  );
  if (match) return match;
  // Bags are a dedicated marketplace category — any bag-related free-form label maps there.
  if (/handbag|backpack|tote|satchel|clutch|purse|wallet|duffel|briefcase|rucksack|bag/i.test(lowered)) return 'Bag';
  if (/laptop|phone|tablet|camera|tv|audio|wearable|gadget/i.test(lowered)) return 'Electronics';
  return 'General';
}

const categoryMedians: Record<string, number> = {
  'sustainable fashion': 350,
  'bag': 250,
  'eco home': 450,
  'electronics': 1200,
  'general': 250,
  'green gadgets': 900,
  'recycled items': 200,
  'skincare': 180,
};

const categoryWeightsKg: Record<string, number> = {
  'sustainable fashion': 0.5,
  'bag': 0.9,
  'eco home': 3,
  'electronics': 1.5,
  'general': 0.5,
  'green gadgets': 0.6,
  'recycled items': 1,
  'skincare': 0.3,
};

// Rough kg CO2e per kg of product — used only for the demo desk's impact line.
// The marketplace computes real footprints via Climatiq when publishing.
const categoryCo2PerKg: Record<string, number> = {
  'sustainable fashion': 25,
  'bag': 25,
  'eco home': 15,
  'electronics': 8,
  'general': 12,
  'green gadgets': 8,
  'recycled items': 5,
  'skincare': 5,
};

const conditionMultipliers = { new: 1, like_new: 0.85, good: 0.65, fair: 0.45, poor: 0.25 };

const CATALOGUE_INSTRUCTIONS = `You catalogue second-hand marketplace products for the CircuCity Swedish resale marketplace. Reply with ONLY a JSON object with keys: category, title, description, condition, suggested_price_sek, estimated_age, estimated_weight_kg, quantity, attributes, grounded. category MUST be one (and only one) of these marketplace categories: ${MARKETPLACE_CATEGORIES.join(', ')}. If the item is a handbag, backpack, tote, satchel, clutch, wallet, duffel, briefcase or any kind of bag put it in "Bag" — never put bags in "General" or in "Sustainable Fashion". If unsure, put it in "General" and give a fallback price estimate rather than guessing a wrong category. Condition must be one of new, like_new, good, fair, poor. Title max 80 characters; description max 300 characters. quantity is the number of identical units the seller has in stock — use 1 unless the photo clearly shows several identical units being sold together. Be honest about visible wear. Never invent a brand, model, material, size, age, authenticity, or functionality that is not clearly visible or confirmed. estimated_weight_kg is the typical shipping weight in kilograms for an item like this (e.g. a t-shirt is about 0.2, a handbag about 0.9, a laptop about 1.8, a book about 0.3). estimated_age must be a short string (e.g. "2 years", "Unknown"), not a number. Every value in "attributes" must be a single string — if there are multiple options, join them with a comma instead of using an array. suggested_price_sek must be a realistic SECOND-HAND price in Swedish kronor for the stated condition, not a new-retail price.`;

const GEMINI_INSTRUCTIONS = `${CATALOGUE_INSTRUCTIONS} You have a Google Search tool: use it to identify the exact product (brand/model) from the photo and to check real current pricing (new retail and/or comparable second-hand listings) before answering, then base suggested_price_sek on what you found, discounted for condition. Set "grounded" to true only if your search actually found this specific item or a very close match; otherwise set it to false and estimate conservatively.`;

function fallbackAnalysis(titleHint: string): Analysis {
  const title = titleHint.trim() || 'Second-hand item';
  const lower = title.toLowerCase();
  const category = lower.match(/handbag|briefcase|backpack|rucksack|tote|satchel|clutch|hand bag|messenger|pochette|duffel/) ? 'Bag'
    : lower.match(/shirt|jacket|dress|shoe|trouser|skirt|coat|jumper|hoodie|t-?shirt|jeans|clothing|apparel/) ? 'Sustainable Fashion'
      : lower.match(/laptop|phone|tablet|camera|tv|headphones|gadget|console|drone|watch|speaker/) ? 'Electronics'
        : lower.match(/skincare|serum|cream|lotion|moisturis|sunscreen|face mask|cleanser|perfume|cologne/) ? 'Skincare'
          : lower.match(/sofa|couch|bed|table|chair|desk|lamp|shelf|rug|mirror|decor|cushion|basket/) ? 'Eco Home'
            : lower.match(/solar|charger|battery|recycled|upcycled|compost|bamboo|organic|eco|saved/) ? 'Recycled Items'
              : 'General';
  return {
    category,
    title: title.slice(0, 80),
    description: `${title} offered second-hand. Review the photo and add any wear, dimensions, or included accessories before publishing.`.slice(0, 300),
    condition: 'good' as const,
    suggested_price_sek: Math.round((categoryMedians[category.toLowerCase()] || categoryMedians.general) * conditionMultipliers.good),
    estimated_age: 'Unknown',
    estimated_weight_kg: categoryWeightsKg[category.toLowerCase()] || categoryWeightsKg.general,
    quantity: 1,
    attributes: {},
    grounded: false,
  };
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return undefined;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}

// Tier 1: Gemini vision + built-in Google Search grounding, in one call. Real
// online data for price/description ("search lens"). Returns null (never throws
// to the caller) so the route can fall through to the next tier.
async function analyzeWithGemini(imageDataUrl: string, titleHint: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const match = imageDataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
  if (!match) return null;
  const [, mimeType, base64Data] = match;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: GEMINI_INSTRUCTIONS }] },
      contents: [{
        role: 'user',
        parts: [
          { text: `Catalogue this item.${titleHint ? ` Seller hint: ${titleHint}` : ''} Search the web to confirm what it is and to find a realistic current second-hand price in SEK.` },
          { inline_data: { mime_type: mimeType, data: base64Data } },
        ],
      }],
      tools: [{ google_search: {} }],
      // thinkingBudget: 0 disables Gemini 2.5's extended-thinking tokens, which
      // otherwise eat into maxOutputTokens and can cut the JSON off mid-way.
      generationConfig: { temperature: 0.2, maxOutputTokens: 1500, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
  const payload = await response.json();
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part: { text?: string }) => part.text || '')
    .join('');
  if (!text) throw new Error('Gemini returned no content');
  return extractJson(text);
}

// Tier 2: OpenAI-compatible vision model, image-only guess (no live search).
async function analyzeWithOpenRouterVision(imageDataUrl: string, titleHint: string): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: CATALOGUE_INSTRUCTIONS },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyse this item for a seller listing.${titleHint ? ` Seller hint: ${titleHint}` : ''}` },
            { type: 'image_url', image_url: { url: imageDataUrl, detail: 'low' } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Vision provider returned ${response.status}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === 'string' ? JSON.parse(content) : content;
}

export async function POST(request: Request) {
  const isKeyed = request.headers.get('x-api-key') === DEMO_API_KEY;
  if (!isKeyed && request.headers.get('x-api-key')) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const identity = isKeyed
    ? `key:${DEMO_API_KEY}`
    : `ip:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'}`;
  const limit = isKeyed ? KEY_DAILY_CAP : IP_DAILY_CAP;
  const today = new Date().toISOString().slice(0, 10);
  const current = usage.get(identity);
  if (current && current.date === today && current.count >= limit) {
    return NextResponse.json({
      error: isKeyed
        ? 'Demo key daily cap reached (50 analyses).'
        : 'Demo cap reached for this visitor (25 analyses/day). Contact us for a demo key.',
    }, { status: 429 });
  }

  const parsed = await request.json().then(
    (body) => requestSchema.safeParse(body),
    () => ({ success: false as const, error: { issues: [{ message: 'Invalid JSON body' }] } }),
  );
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
  if (parsed.data.imageDataUrl && !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(parsed.data.imageDataUrl)) {
    return NextResponse.json({ error: 'AI analysis supports JPEG, PNG, and WEBP images' }, { status: 400 });
  }

  // Per-identity in-flight cap (defense in depth on top of the global cap) so a
  // single client cannot occupy the whole analysis pool.
  if ((inflightById.get(identity) || 0) >= 2 || inflight >= MAX_INFLIGHT) {
    return NextResponse.json({ error: 'Busy — several analyses are already running. Wait a moment and retry.' }, { status: 429 });
  }
  inflight += 1;
  inflightById.set(identity, (inflightById.get(identity) || 0) + 1);
  try {
    let raw: unknown;
    let source: 'gemini' | 'vision' | 'fallback' = 'fallback';

    if (parsed.data.imageDataUrl) {
      try {
        raw = await analyzeWithGemini(parsed.data.imageDataUrl, parsed.data.titleHint);
        if (raw) source = 'gemini';
      } catch (error) {
        console.error('[Demo Listing] Gemini analysis failed, trying next provider:', error);
      }

      if (!raw) {
        try {
          raw = await analyzeWithOpenRouterVision(parsed.data.imageDataUrl, parsed.data.titleHint);
          if (raw) source = 'vision';
        } catch (error) {
          console.error('[Demo Listing] Vision analysis failed, using local fallback:', error);
        }
      }
    }

    let analysis = analysisSchema.safeParse(raw);
    if (!analysis.success) {
      source = 'fallback';
      analysis = analysisSchema.safeParse(fallbackAnalysis(parsed.data.titleHint));
    }
    if (!analysis.success) return NextResponse.json({ error: 'Could not produce a valid listing draft' }, { status: 502 });

    track(identity);

    const value = analysis.data;
    const category = normalizeCategory(value.category);
    const attributes = Object.fromEntries(
      Object.entries(value.attributes).map(([key, item]) => [key, Array.isArray(item) ? item.join(', ') : String(item)]),
    );
    const weight = value.estimated_weight_kg;
    const co2Factor = categoryCo2PerKg[category.toLowerCase()] || categoryCo2PerKg.general;
    const co2Saved = Math.round((weight * co2Factor) * 100) / 100;

    return NextResponse.json({
      source,
      priceGrounded: source === 'gemini' && value.grounded,
      category,
      subcategories: category.split(/\s*>\s*/).slice(1),
      title: value.title,
      description: value.description,
      condition: value.condition,
      suggestedPriceSek: value.suggested_price_sek,
      estimatedAge: value.estimated_age,
      estimatedWeightKg: value.estimated_weight_kg,
      quantity: value.quantity,
      attributes,
      attributeOptions: Object.fromEntries(Object.entries(attributes).map(([key, item]) => [key, [item]])),
      tags: [...new Set(category.split(/\s*>\s*/).concat(Object.values(attributes)).filter(Boolean))].slice(0, 8),
      co2Saved,
      rawResponse: value,
      quota: { keyed: isKeyed, used: usage.get(identity)?.count || 0, limit },
    });
  } finally {
    inflight -= 1;
    inflightById.set(identity, Math.max(0, (inflightById.get(identity) || 0) - 1));
  }
}
