import type { QueryIntent } from "@/lib/query-understanding";
import { parsePriceFromQuery } from "@/lib/product-search";

const GREETING_RE =
  /^(hello|hi|hey|howdy|good\s*(morning|afternoon|evening)|thanks|thank\s*you|bye|goodbye|yes|no|ok|okay)[!.?\s]*$/i;

const FAQ_RE =
  /\b(return\s*policy|returns?|refund|shipping|delivery|ship|deliver|privacy|terms|warranty|exchange|cancellation)\b/i;

// Site-feature questions ("how do eco tokens work", "what is the swap market",
// "how do I become a seller") are informational — classify them as FAQ
// deterministically so they get knowledge-based answers instead of falling
// into the shopping pipeline.
const FAQ_FEATURE_RE =
  /\b(eco[- ]?tokens?|swap\s*(?:market|feature|items?|thing)?|reward\s*points?|become\s+a\s+seller|sell\s+on|how\s+to\s+sell|track\s+(?:my\s+)?order|order\s+status|free\s+shipping)\b|\bhow\s+(?:does|do|is|are)\b[^.!?]{0,60}\b(work|function|operate)\b|\bwhat\s+is\s+(?:a|an|the)?\s*(?:circucity|eco[- ]?tokens?|swap|return\s*policy|shipping\s*policy|refund|warranty|delivery\s*time|order\s*status)\b/i;

const SUPPORT_RE =
  /\b(speak\s+to\s+(a\s+)?(human|agent|person|representative)|talk\s+to\s+(a\s+)?(human|agent|person)|real\s+person|human\s+agent|connect\s+me|escalat|live\s+agent)\b/i;

const COMPLAINT_RE =
  /\b(terrible|awful|worst|angry|furious|unacceptable|disgusted|horrible|scam|fraud)\b/i;

const GIFT_RE =
  /\b(gift|present|birthday|anniversary|christmas|mother'?s?\s*day|father'?s?\s*day)\b/i;

const DISCOUNT_RE =
  /\b(discount|promo\s*code|coupon|voucher|%\s*off|percent\s*off|code\s+for)\b/i;

const PRODUCT_RE =
  /\b(show\s+me|looking\s+for|find\s+me|search\s+for|do\s+you\s+(sell|have|carry)|recommend|products?\s+under|need\s+a|want\s+(?:to\s+buy\s+)?a|need\s+something|eco[- ]?friendly|sustainable)\b/i;

const PRODUCT_NOUN_RE =
  /\b(bag|bags|tote|lamp|lamps|dress|shirt|jacket|shoe|bracelet|bottle|mug|yoga|gadget|laptop|gaming)\b/i;

function extractKeywords(message: string): string[] {
  const lower = message.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const extra: string[] = [];
  if (/eco[- ]?friendly/i.test(lower)) extra.push("eco-friendly", "sustainable", "organic");
  if (/\bbags?\b/.test(lower)) extra.push("bag", "bags", "tote");
  if (/\btotes?\b/.test(lower)) extra.push("tote", "bag");
  if (/\blamps?\b/.test(lower)) extra.push("lamp", "led");

  return [...new Set([...words, ...extra])];
}

function extractGiftFor(message: string): string | undefined {
  const m = message.match(/\b(?:for\s+)?my\s+(mom|mother|dad|father|wife|husband|partner|friend|sister|brother|son|daughter)\b/i);
  return m ? m[1].toLowerCase() : undefined;
}

function extractGiftOccasion(message: string): string | undefined {
  if (/birthday/i.test(message)) return "birthday";
  if (/christmas/i.test(message)) return "christmas";
  if (/anniversary/i.test(message)) return "anniversary";
  return undefined;
}

/** Rule-based intent — returns null when LLM fallback is needed. */
export function detectFastIntent(message: string): QueryIntent | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  if (GREETING_RE.test(trimmed)) {
    return { intent: "greeting", keywords: [], impliedMeaning: trimmed };
  }

  if (SUPPORT_RE.test(trimmed)) {
    return {
      intent: "support",
      keywords: extractKeywords(trimmed),
      impliedMeaning: "customer wants human support",
    };
  }

  if (DISCOUNT_RE.test(trimmed)) {
    return {
      intent: "faq",
      keywords: extractKeywords(trimmed),
      impliedMeaning: "discount or promotion inquiry",
    };
  }

  if (COMPLAINT_RE.test(trimmed)) {
    return {
      intent: "complaint",
      keywords: extractKeywords(trimmed),
      impliedMeaning: "customer complaint",
    };
  }

  const prices = parsePriceFromQuery(trimmed);

  if (GIFT_RE.test(trimmed) && !PRODUCT_NOUN_RE.test(trimmed)) {
    return {
      intent: "gift_shopping",
      keywords: extractKeywords(trimmed),
      impliedMeaning: "gift shopping",
      giftFor: extractGiftFor(trimmed),
      giftOccasion: extractGiftOccasion(trimmed),
      ...prices,
    };
  }

  if (
    (FAQ_RE.test(trimmed) || FAQ_FEATURE_RE.test(trimmed)) &&
    !PRODUCT_NOUN_RE.test(trimmed) &&
    !prices.priceMax &&
    !prices.priceMin
  ) {
    return {
      intent: "faq",
      keywords: extractKeywords(trimmed),
      impliedMeaning: trimmed,
    };
  }

  if (
    PRODUCT_RE.test(trimmed) ||
    PRODUCT_NOUN_RE.test(trimmed) ||
    prices.priceMax !== undefined ||
    prices.priceMin !== undefined
  ) {
    return {
      intent: "product_search",
      keywords: extractKeywords(trimmed),
      impliedMeaning: trimmed,
      ...prices,
    };
  }

  if (/this\s+product|tell\s+me\s+about/i.test(trimmed)) {
    return {
      intent: "product_search",
      keywords: extractKeywords(trimmed),
      impliedMeaning: "page product inquiry",
    };
  }

  return null;
}