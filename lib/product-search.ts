import prisma from "@/lib/db";
import { fetchLiveCatalog } from "@/lib/live-catalog";
import type { QueryIntent } from "@/lib/query-understanding";

const CATEGORY_AFFINITY: Record<string, string[]> = {
  clothing: ["fashion", "apparel", "wear", "dress", "shirt", "pants", "jeans", "jacket", "coat", "sweater", "hoodie", "t-shirt", "outfit", "attire", "dresses", "shirts", "jackets"],
  fashion: ["clothing", "apparel", "wear", "dress", "accessories", "bags", "shoes", "style", "outfit", "dresses"],
  accessories: ["fashion", "bags", "watches", "belts", "hats", "scarves", "gloves", "sunglasses"],
  jewelry: ["accessories", "bracelet", "necklace", "ring", "earrings", "watch", "gold", "silver", "bracelets"],
  bags: ["accessories", "fashion", "backpack", "tote", "handbag", "purse", "bag", "backpacks", "totes", "carry"],
  "jewelry & accessories": ["accessories", "jewelry", "bracelet", "necklace", "ring", "bag", "watch"],
  "home & living": ["home", "kitchen", "decor", "furniture", "glass", "drinkware", "mug", "cup", "plate", "bowl"],
  kitchen: ["home", "drinkware", "glass", "cooking", "dining", "cutting", "board"],
  drinkware: ["home", "kitchen", "glass", "cup", "mug", "bottle", "drinking", "water", "bottles"],
  "eco-friendly": ["sustainable", "green", "organic", "reusable", "environmental", "natural", "eco"],
  organic: ["eco-friendly", "sustainable", "natural", "green", "cotton", "fabric"],
  "bags & totes": ["bags", "accessories", "fashion", "tote", "bag", "shopping", "carry", "totes", "cotton"],
  "sustainable fashion": ["fashion", "clothing", "bags", "tote", "organic", "cotton", "eco"],
  "green gadgets": ["electronics", "lamp", "gadget", "energy", "led", "tech"],
  skincare: ["beauty", "cream", "serum", "moisturizer", "cleanser", "balm"],
};

const PRODUCT_NOUNS = new Set([
  "bag", "bags", "tote", "totes", "backpack", "purse", "handbag",
  "lamp", "lamps", "bottle", "bottles", "mug", "mugs", "cup", "cups",
  "dress", "dresses", "shirt", "shirts", "jeans", "pants", "shoe", "shoes",
  "sneaker", "sneakers", "boot", "boots", "jacket", "jackets", "hoodie", "hoodies",
  "bracelet", "bracelets", "necklace", "necklaces", "ring", "rings", "watch", "watches",
  "mat", "mats", "candle", "candles", "soap", "shampoo", "cream", "serum",
  "chair", "chairs", "table", "tables", "desk", "sofa", "couch", "bed",
  "phone", "phones", "laptop", "laptops", "tablet", "tablets", "gadget", "gadgets",
  "yoga", "towel", "towels", "board", "boards", "toothbrush", "balm",
]);

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "has", "had",
  "her", "his", "how", "its", "may", "our", "out", "own", "per", "she", "too", "use",
  "way", "who", "why", "buy", "get", "let", "new", "now", "one", "see", "say", "try",
  "shop", "store", "product", "products", "item", "items", "thing", "things", "want",
  "need", "look", "looking", "find", "search", "help", "please", "thank", "thanks",
  "hello", "hi", "hey", "good", "great", "nice", "cool", "awesome", "love", "like",
  "what", "which", "where", "when", "do", "does", "did", "done", "got", "getting",
  "sure", "ok", "okay", "yes", "no", "know", "well", "here", "there", "much", "more",
  "some", "something", "anything", "everything", "nothing", "show", "eco", "friendly",
  "sell", "have", "your", "about", "tell", "cheapest", "cheap", "budget",
  "recommend", "recommended", "suggestion", "suggestions", "purchase", "best",
]);

function stem(w: string): string {
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("es")) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordMatch(text: string, term: string): boolean {
  const t = term.toLowerCase();
  const tl = text.toLowerCase();
  if (tl.includes(t)) return true;
  const s = stem(t);
  if (s !== t && tl.includes(s)) return true;
  return new RegExp("\\b" + escapeRegex(t) + "\\b", "i").test(tl);
}

function extractNouns(terms: string[]): string[] {
  return terms.filter((t) => PRODUCT_NOUNS.has(t) || PRODUCT_NOUNS.has(stem(t)));
}

function extractQualifiers(terms: string[], nouns: string[]): string[] {
  const nounStems = new Set(nouns.map((n) => stem(n)));
  return terms.filter((t) => {
    const s = stem(t);
    return !PRODUCT_NOUNS.has(t) && !PRODUCT_NOUNS.has(s) && !nounStems.has(s);
  });
}

export function parsePriceFromQuery(query: string): { priceMin?: number; priceMax?: number } {
  const q = query.toLowerCase();
  const result: { priceMin?: number; priceMax?: number } = {};

  const under = q.match(/(?:under|below|less than|cheaper than|max|maximum)\s*(\d+)/);
  if (under) result.priceMax = Number(under[1]);

  const over = q.match(/(?:over|above|more than|min|minimum|at least)\s*(\d+)/);
  if (over) result.priceMin = Number(over[1]);

  const range = q.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) {
    result.priceMin = Number(range[1]);
    result.priceMax = Number(range[2]);
  }

  return result;
}

export interface ProductResult {
  id: string;
  name: string;
  price: number;
  url: string | null;
  image: string | null;
  description: string | null;
  category: string | null;
  stock: number | null;
  currency: string;
  relevance: number;
}

function toResult(p: {
  id: string;
  name: string;
  price: number;
  url: string | null;
  image: string | null;
  description: string | null;
  category: string | null;
  stock: number | null;
  currency: string;
}, relevance: number): ProductResult {
  return { ...p, relevance };
}

function scoreProduct(
  p: {
    name: string;
    price: number;
    description: string | null;
    category: string | null;
  },
  searchTerms: string[],
  nouns: string[],
  qualifiers: string[],
  intent?: QueryIntent | null,
): number {
  let score = 0;
  const nameLower = (p.name || "").toLowerCase();
  const catLower = (p.category || "").toLowerCase();
  const descLower = (p.description || "").toLowerCase();
  const combined = `${nameLower} ${catLower} ${descLower}`;
  const nameWords = nameLower.split(/\s+/).filter(Boolean);

  // Generic single-word product names must match qualifiers in description/category
  if (qualifiers.length > 0) {
    const qualHits = qualifiers.filter((q) => wordMatch(combined, q)).length;
    if (qualHits === 0) return 0;
    if (qualHits < qualifiers.length) score -= 40;
    else score += 45;
  }

  if (nameWords.length <= 2 && qualifiers.length > 0) {
    const nameOnlyMatchesQualifier = qualifiers.some((q) => wordMatch(nameLower, q));
    if (!nameOnlyMatchesQualifier && !qualifiers.every((q) => wordMatch(descLower + " " + catLower, q))) {
      return 0;
    }
  }

  for (const term of searchTerms) {
    const t = term.toLowerCase();
    if (nameLower === t) score += 120;
    else if (new RegExp("\\b" + escapeRegex(t) + "\\b", "i").test(nameLower)) score += 70;
    else if (catLower.includes(t) || catLower.includes(stem(t))) score += 45;
    else if (descLower.includes(t)) score += 20;
  }

  if (nouns.length > 0) {
    const nounHits = nouns.filter((n) => wordMatch(combined, n)).length;
    if (nounHits === 0) return 0;
    if (nounHits === nouns.length) score += 80;
    else score += 40 * nounHits;
  }

  const matchedTerms = searchTerms.filter((t) => wordMatch(combined, t)).length;
  if (searchTerms.length >= 2 && matchedTerms < 2) score -= 30;

  if (intent?.priceMin !== undefined && p.price >= intent.priceMin) score += 15;
  if (intent?.priceMax !== undefined && p.price <= intent.priceMax) score += 15;
  if (intent?.category && catLower.includes(intent.category.toLowerCase())) score += 35;

  return score;
}

function searchByPrice(
  products: Array<{
    id: string;
    name: string;
    price: number;
    url: string | null;
    image: string | null;
    description: string | null;
    category: string | null;
    stock: number | null;
    currency: string;
  }>,
  priceMin?: number,
  priceMax?: number,
): ProductResult[] {
  return products
    .filter((p) => {
      if (priceMax !== undefined && p.price > priceMax) return false;
      if (priceMin !== undefined && p.price < priceMin) return false;
      return true;
    })
    .sort((a, b) => a.price - b.price)
    .slice(0, 5)
    .map((p, i) => toResult(p, 100 - i));
}

function findAffinityCategory(terms: string[]): string | null {
  for (const t of terms) {
    if (CATEGORY_AFFINITY[t]) return t;
    const s = stem(t);
    if (CATEGORY_AFFINITY[s]) return s;
  }
  for (const [cat, related] of Object.entries(CATEGORY_AFFINITY)) {
    if (terms.some((t) => related.includes(t) || related.includes(stem(t)))) return cat;
  }
  return null;
}

export async function searchProducts(
  storeId: string,
  query: string,
  intent?: QueryIntent | null,
  store?: { websiteUrl?: string | null; url?: string | null } | null,
): Promise<ProductResult[]> {
  const parsed = parsePriceFromQuery(query);
  const priceMin = intent?.priceMin ?? parsed.priceMin;
  const priceMax = intent?.priceMax ?? parsed.priceMax;
  const isPriceQuery =
    (priceMax !== undefined || priceMin !== undefined) &&
    /under|below|less than|cheaper|budget|price|kr|sek|\d/i.test(query);

  const rawTerms = intent?.keywords?.length
    ? intent.keywords.flatMap((k: string) => k.toLowerCase().split(/\s+/))
    : query.toLowerCase().split(/\s+/);

  let searchTerms = [...new Set(rawTerms.filter((w) => w.length > 2 && !STOP_WORDS.has(w)))];
  if (searchTerms.length === 0) {
    searchTerms = [...new Set(
      query.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
    )];
  }

  if (store) await fetchLiveCatalog(storeId, store);

  const allProducts = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: {
      id: true, name: true, price: true, url: true, image: true,
      description: true, category: true, stock: true, currency: true, lastSynced: true,
    },
  });

  if (allProducts.length === 0) return [];

  if (isPriceQuery) {
    const priceResults = searchByPrice(allProducts, priceMin, priceMax);
    if (priceResults.length > 0) return priceResults;
  }

  // "Popular/best-selling/top-rated" queries: rank by cart-add counts, recency as tiebreak.
  const isPopularQuery = /popular|best.selling|top.rated|trending|bestseller|most.popular|most.liked|highest.rating/i.test(query);
  if (isPopularQuery && searchTerms.length > 0) {
    const cartCounts = await prisma.cartItem.groupBy({
      by: ["productId"],
      where: { storeId },
      _count: { productId: true },
    });
    const countMap = new Map(cartCounts.map((c) => [c.productId, c._count.productId]));
    const popular = allProducts
      .map((p) => {
        const adds = countMap.get(p.id) || 0;
        const recency = p.lastSynced ? Date.parse(p.lastSynced.toISOString()) : 0;
        return { p, relevance: adds * 1000 + Math.min(recency / 1e9, 1) };
      })
      .sort((a, b) => b.relevance - a.relevance)
      .map(({ p, relevance }) => toResult(p, relevance));
    return popular.slice(0, 5);
  }

  if (searchTerms.length === 0) return [];

  const nouns = extractNouns(searchTerms);
  const qualifiers = extractQualifiers(searchTerms, nouns);

  const scored = allProducts
    .map((p) => toResult(p, scoreProduct(p, searchTerms, nouns, qualifiers, intent)))
    .filter((p) => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  if (scored.length === 0) {
    if (isPriceQuery) return searchByPrice(allProducts, priceMin, priceMax);

    const affinityCat = findAffinityCategory(searchTerms);
    if (!affinityCat || qualifiers.length > 0) return [];

    const relatedTerms = CATEGORY_AFFINITY[affinityCat] || [];
    const relatedCategories = new Set<string>([affinityCat]);
    for (const [cat, terms] of Object.entries(CATEGORY_AFFINITY)) {
      if (terms.some((t) => t === affinityCat || relatedTerms.includes(t))) {
        relatedCategories.add(cat.toLowerCase());
      }
    }

    const fallback = allProducts
      .map((p) => {
        const catLower = (p.category || "").toLowerCase();
        const nameLower = (p.name || "").toLowerCase();
        const inCluster = [...relatedCategories].some((rc) => catLower.includes(rc));
        if (!inCluster) return null;

        let score = 20;
        if (catLower.includes(affinityCat)) score += 50;
        for (const rt of relatedTerms) {
          if (nameLower.includes(rt)) score += 25;
        }
        for (const n of nouns) {
          if (wordMatch(nameLower + " " + catLower, n)) score += 40;
        }
        if (nouns.length > 0 && !nouns.some((n) => wordMatch(nameLower + " " + catLower, n))) {
          return null;
        }

        return toResult(p, score);
      })
      .filter(Boolean)
      .sort((a, b) => b!.relevance - a!.relevance) as ProductResult[];

    return fallback.slice(0, 5);
  }

  const maxScore = scored[0].relevance;
  const threshold = Math.max(maxScore * 0.55, nouns.length > 0 ? 35 : 20);

  return scored.filter((p) => p.relevance >= threshold).slice(0, 5);
}

function cleanDesc(p: ProductResult): string {
  const d = p.description || "";
  if (!d || d.length < 20 || d.includes("Shop conscious") || d.includes("eco-friendly products that make a difference")) {
    const cat = p.category || "";
    if (p.name && cat) return "A " + cat.toLowerCase().replace(/_/g, " ") + " product: " + p.name;
    if (p.name) return p.name + " - available now";
    return "Available product";
  }
  return d;
}

export function formatProductsForPrompt(products: ProductResult[]): string {
  if (products.length === 0) return "No matching products found.";

  return products
    .map(
      (p) =>
        `- ${p.name}${p.price ? " (" + p.price + " " + (p.currency || "") + ")" : ""}${
          cleanDesc(p) ? " - " + cleanDesc(p).substring(0, 150) : ""
        }${p.url ? " [Link: " + p.url + "]" : ""}`,
    )
    .join("\n");
}

// â”€â”€â”€ Semantic Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { generateEmbedding, formatEmbeddingForSQL } from "@/lib/embeddings";

export async function semanticSearchProducts(
  query: string,
  storeId: string,
  limit: number = 5
): Promise<ProductSearchResult[]> {
  const embedding = await generateEmbedding(query);
  if (embedding.length === 0) return [];

  const vec = formatEmbeddingForSQL(embedding);
  try {
    // SAFE: all values are bound parameters ($1/$2/$3), never string-interpolated.
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, name, price, image, description, category, slug, url, currency,
             1 - (embedding <=> $1::vector) AS similarity
      FROM "Product"
      WHERE "storeId" = $2 AND "isActive" = true AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `, vec, storeId, limit);

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      price: r.price,
      image: r.image || undefined,
      description: r.description || undefined,
      category: r.category || undefined,
      slug: r.slug || undefined,
      url: r.url || undefined,
      currency: r.currency,
      score: Math.round((r.similarity || 0) * 100),
    }));
  } catch (e) {
    console.error("Semantic search failed:", e);
    return [];
  }
}

export async function embedStoreProducts(storeId: string): Promise<number> {
  const products: any[] = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: { id: true, name: true, description: true, category: true },
  });
  let count = 0;
  for (const p of products) {
    const text = [p.name, p.category, p.description].filter(Boolean).join(" ");
    const emb = await generateEmbedding(text);
    if (emb.length > 0) {
      const vec = formatEmbeddingForSQL(emb);
      await prisma.$executeRawUnsafe(
        `UPDATE "Product" SET embedding = $1::vector WHERE id = $2`,
        vec, p.id
      );
      count++;
    }
  }
  return count;
}
