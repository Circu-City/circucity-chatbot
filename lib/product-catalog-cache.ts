import prisma from "@/lib/db";

export type CatalogProduct = {
  name: string;
  price: number;
  url: string | null;
  image: string | null;
  description: string | null;
  currency: string;
  category: string | null;
};

type CacheEntry = { products: CatalogProduct[]; expiresAt: number };

const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

export async function getStoreCatalog(storeId: string): Promise<CatalogProduct[]> {
  const now = Date.now();
  const hit = CACHE.get(storeId);
  if (hit && hit.expiresAt > now) return hit.products;

  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: {
      name: true,
      price: true,
      url: true,
      image: true,
      description: true,
      currency: true,
      category: true,
    },
    take: 100,
  });

  CACHE.set(storeId, { products, expiresAt: now + TTL_MS });
  return products;
}

export function formatCatalogCompact(products: CatalogProduct[]): string {
  if (!products.length) return "(no products)";

  const groups: Record<string, string[]> = {};
  for (const p of products) {
    const cat = p.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    const price = p.price ? ` (${p.price} ${p.currency || ""})` : "";
    groups[cat].push(`- ${p.name}${price}`);
  }

  return Object.entries(groups)
    .map(([cat, items]) => `[${cat}]\n` + items.join("\n"))
    .join("\n\n");
}

export function formatCatalogNamesOnly(products: CatalogProduct[]): string {
  if (!products.length) return "(no products)";
  const groups: Record<string, string[]> = {};
  for (const p of products) {
    const cat = p.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p.name);
  }
  return Object.entries(groups)
    .map(([cat, names]) => `${cat}: ${names.join(", ")}`)
    .join("; ");
}