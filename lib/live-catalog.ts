import prisma from "@/lib/db";

export interface LiveCatalogProduct {
  id?: string;
  name: string;
  price: number;
  url?: string | null;
  image?: string | null;
  description?: string | null;
  category?: string | null;
  stock?: number | null;
  currency?: string;
}

const CACHE_TTL_MS = 2 * 60 * 1000;
const storeCache = new Map<string, { products: LiveCatalogProduct[]; fetchedAt: number }>();

const CATALOG_PATHS = ["/api/catalog/live", "/api/ai/products"];

export function getStoreBaseUrl(store: {
  websiteUrl?: string | null;
  url?: string | null;
}): string | null {
  const raw = store.websiteUrl || store.url;
  if (!raw) return null;
  return raw.startsWith("http")
    ? raw.replace(/\/+$/, "")
    : `https://${raw.replace(/\/+$/, "")}`;
}

function normalizeCatalogResponse(data: unknown, baseUrl: string): LiveCatalogProduct[] {
  const payload = data as {
    products?: unknown[];
    data?: { products?: unknown[] };
  };

  const items = Array.isArray(data)
    ? data
    : payload.products || payload.data?.products || [];

  return items
    .map((item) => {
      const p = item as Record<string, unknown>;
      const category =
        typeof p.category === "string"
          ? p.category
          : (p.category as { name?: string } | null)?.name || null;
      const id = typeof p.id === "string" ? p.id : undefined;

      return {
        id,
        name: String(p.name || ""),
        price: Number(p.price) || 0,
        url:
          typeof p.url === "string"
            ? p.url
            : id
              ? `${baseUrl}/products/${id}`
              : null,
        image:
          typeof p.image === "string"
            ? p.image
            : Array.isArray(p.images)
              ? String(p.images[0] || "") || null
              : null,
        description:
          typeof p.description === "string"
            ? p.description.substring(0, 500)
            : null,
        category,
        stock:
          typeof p.stock === "number"
            ? p.stock
            : typeof p.inventory === "number"
              ? p.inventory
              : null,
        currency: typeof p.currency === "string" ? p.currency : "SEK",
      } satisfies LiveCatalogProduct;
    })
    .filter((p) => p.name.length > 0);
}

async function syncProductsToDb(storeId: string, products: LiveCatalogProduct[]) {
  for (const p of products) {
    try {
      const existing = p.url
        ? await prisma.product.findFirst({ where: { storeId, url: p.url } })
        : p.id
          ? await prisma.product.findFirst({ where: { storeId, slug: p.id } })
          : await prisma.product.findFirst({ where: { storeId, name: p.name } });

      const data = {
        name: p.name,
        price: p.price,
        url: p.url,
        slug: p.id || null,
        image: p.image,
        description: p.description,
        category: p.category,
        stock: p.stock,
        currency: p.currency || "SEK",
        isActive: true,
        lastSynced: new Date(),
      };

      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
      } else {
        await prisma.product.create({ data: { storeId, ...data } });
      }
    } catch (error) {
      console.error("[LiveCatalog] Failed to sync product:", p.name, error);
    }
  }

  const urls = products.map((p) => p.url).filter(Boolean) as string[];
  if (urls.length > 0) {
    await prisma.product.updateMany({
      where: { storeId, isActive: true, url: { notIn: urls } },
      data: { isActive: false },
    });
  }
}

export async function fetchLiveCatalog(
  storeId: string,
  store: { websiteUrl?: string | null; url?: string | null },
  query?: string,
): Promise<LiveCatalogProduct[]> {
  const cached = storeCache.get(storeId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS && !query) {
    return cached.products;
  }

  const baseUrl = getStoreBaseUrl(store);
  if (!baseUrl) return cached?.products || [];

  for (const path of CATALOG_PATHS) {
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("limit", "100");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${baseUrl}${path}?${params}`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "CircuCity-CatalogSync/1.0",
          Accept: "application/json",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const products = normalizeCatalogResponse(data, baseUrl);
      if (products.length === 0) continue;

      if (!query) {
        storeCache.set(storeId, { products, fetchedAt: Date.now() });
        await syncProductsToDb(storeId, products);
      }

      return products;
    } catch (error) {
      console.error(`[LiveCatalog] ${baseUrl}${path} failed:`, error);
    }
  }

  return cached?.products || [];
}