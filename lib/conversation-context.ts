import prisma from "@/lib/db";
import type { ProductResult } from "@/lib/product-search";
import { parsePriceFromQuery } from "@/lib/product-search";

export interface ConversationContext {
  topic: string;
  searchQuery: string;
  productIds: string[];
  nouns: string[];
  category?: string;
  intent: string;
  shownProductIds: string[];
  updatedAt: string;
}

export type FollowUpType =
  | "cheapest"
  | "expensive"
  | "ordinal"
  | "more"
  | "compare"
  | "refine"
  | "pronoun"
  | null;

const FOLLOW_UP_RE = {
  cheapest: /(?:cheapest|lowest\s*price|least\s*expensive|most\s*affordable|best\s*value|under\s*my\s*budget)/i,
  expensive: /(?:most\s*expensive|priciest|premium|highest\s*price|top[\s-]?end)/i,
  ordinal: /(?:the\s+)?(first|second|third|fourth|last|1st|2nd|3rd)\s*(?:one|option|item)?/i,
  more: /(?:any\s+)?(?:other|more|another)\s*(?:ones?|options?|products?|choices?)?|show\s+me\s+more|what\s+else/i,
  compare: /compare|side[\s-]by[\s-]side|difference\s+between|which\s+(?:one|is\s+better)/i,
  pronoun: /^(?:what\s+about\s+)?(?:that|this|it|them|those)\s*(?:one)?\??$/i,
  refine: /(?:under|below|less\s+than|over|above|more\s+than|around|about)\s*\d+/i,
};

const SHORT_FOLLOW_UP =
  /^(?:the\s+)?(?:cheapest|lowest|best|first|second|third|last|more|others?|that|this|it)\s*(?:one)?\??$/i;

export function parseConversationContext(raw: string | null | undefined): ConversationContext | null {
  if (!raw) return null;
  try {
    const ctx = JSON.parse(raw) as ConversationContext;
    if (!ctx?.topic || !ctx?.productIds?.length) return null;
    return ctx;
  } catch {
    return null;
  }
}

export function detectFollowUp(message: string, ctx: ConversationContext | null): FollowUpType {
  if (!ctx) return null;
  const msg = message.trim();

  if (FOLLOW_UP_RE.cheapest.test(msg)) return "cheapest";
  if (FOLLOW_UP_RE.expensive.test(msg)) return "expensive";
  if (FOLLOW_UP_RE.compare.test(msg)) return "compare";
  if (FOLLOW_UP_RE.ordinal.test(msg)) return "ordinal";
  if (FOLLOW_UP_RE.more.test(msg)) return "more";
  if (FOLLOW_UP_RE.pronoun.test(msg)) return "pronoun";
  if (FOLLOW_UP_RE.refine.test(msg)) return "refine";
  if (msg.length < 60 && SHORT_FOLLOW_UP.test(msg)) {
    if (/cheapest|lowest|best/i.test(msg)) return "cheapest";
    if (/first|second|third|last/i.test(msg)) return "ordinal";
    if (/more|other/i.test(msg)) return "more";
    return "pronoun";
  }

  return null;
}

function ordinalIndex(message: string): number {
  const m = message.match(/first|1st/i) ? 0
    : message.match(/second|2nd/i) ? 1
    : message.match(/third|3rd/i) ? 2
    : message.match(/fourth|4th/i) ? 3
    : message.match(/last/i) ? -1
    : 0;
  return m;
}

export async function loadContextProducts(
  storeId: string,
  productIds: string[],
): Promise<ProductResult[]> {
  if (!productIds.length) return [];
  const products = await prisma.product.findMany({
    where: { storeId, isActive: true, id: { in: productIds } },
    select: {
      id: true, name: true, price: true, url: true, image: true,
      description: true, category: true, stock: true, currency: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return productIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p, i) => ({ ...p!, relevance: 100 - i }));
}

export async function resolveFollowUpProducts(
  storeId: string,
  message: string,
  followUpType: FollowUpType,
  ctx: ConversationContext,
): Promise<ProductResult[]> {
  const products = await loadContextProducts(storeId, ctx.productIds);
  if (!products.length) return [];

  switch (followUpType) {
    case "cheapest":
      return [...products].sort((a, b) => a.price - b.price).slice(0, 1);

    case "expensive":
      return [...products].sort((a, b) => b.price - a.price).slice(0, 1);

    case "ordinal": {
      const idx = ordinalIndex(message);
      const sorted = [...products].sort((a, b) => a.price - b.price);
      const pick = idx === -1 ? sorted[sorted.length - 1] : sorted[idx];
      return pick ? [pick] : sorted.slice(0, 1);
    }

    case "pronoun":
      return products.slice(0, 1);

    case "more": {
      const shown = new Set(ctx.shownProductIds);
      const remaining = products.filter((p) => !shown.has(p.id));
      return remaining.length ? remaining.slice(0, 3) : products.slice(1, 4);
    }

    case "compare":
      return products.slice(0, 3);

    case "refine": {
      const { priceMin, priceMax } = parsePriceFromQuery(message);
      const filtered = products.filter((p) => {
        if (priceMax !== undefined && p.price > priceMax) return false;
        if (priceMin !== undefined && p.price < priceMin) return false;
        return true;
      });
      return filtered.length ? filtered.slice(0, 5) : products.slice(0, 3);
    }

    default:
      return products.slice(0, 3);
  }
}

export function buildEnrichedQuery(message: string, ctx: ConversationContext, followUpType: FollowUpType): string {
  const topic = ctx.topic || ctx.searchQuery;
  switch (followUpType) {
    case "cheapest":
      return `cheapest ${topic}`;
    case "expensive":
      return `most expensive ${topic}`;
    case "more":
      return `more ${topic} options`;
    case "compare":
      return `compare ${topic}`;
    case "refine":
      return `${topic} ${message}`;
    default:
      return `${topic} — ${message}`;
  }
}

export function extractNounsFromQuery(query: string): string[] {
  const nouns = new Set([
    "bag", "bags", "tote", "totes", "lamp", "lamps", "bottle", "dress", "laptop",
    "bracelet", "shirt", "shoe", "mug", "board", "candle", "watch",
  ]);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => nouns.has(w) || nouns.has(w.replace(/s$/, "")));
}

export function buildConversationContext(
  message: string,
  products: ProductResult[],
  intent: string,
  impliedMeaning?: string,
  existing?: ConversationContext | null,
): ConversationContext {
  const nouns = extractNounsFromQuery(impliedMeaning || message);
  const shown = existing?.shownProductIds || [];
  const newShown = [...new Set([...shown, ...products.map((p) => p.id)])];

  return {
    topic: impliedMeaning || message,
    searchQuery: message,
    productIds: products.map((p) => p.id),
    nouns,
    category: products[0]?.category || existing?.category,
    intent,
    shownProductIds: newShown,
    updatedAt: new Date().toISOString(),
  };
}

export function shouldPreserveContext(intent: string | undefined, isFollowUp: boolean): boolean {
  if (isFollowUp) return true;
  return intent === "product_search" || intent === "gift_shopping";
}