import prisma from "@/lib/db";
import { getShopifyGraphqlClient } from "./client";
import { PRODUCTS_QUERY, INVENTORY_QUERY, STORE_POLICIES_QUERY } from "./queries";
import { refreshAccessToken } from "@/lib/integrations/oauth";

const PAGE_SIZE = 250;
const MAX_PAGES = 10;

async function ensureFreshToken(channel: any): Promise<any> {
  let creds: any = {};
  try {
    creds = channel.credentials ? JSON.parse(channel.credentials) : {};
  } catch {}
  if (!creds.accessToken) throw new Error("No Shopify access token stored");
  if (!creds.refreshToken) return creds;

  const expiresAt = creds.tokenExpiresAt ? new Date(creds.tokenExpiresAt).getTime() : 0;
  const now = Date.now();
  if (expiresAt && now < expiresAt - 5 * 60 * 1000) return creds;

  const shopDomain = getShopDomainFromChannel(channel);
  if (!shopDomain) throw new Error("Shopify shop domain unknown");
  const fresh = await refreshAccessToken("shopify", creds.refreshToken, shopDomain).catch((e: any) => {
    throw new Error("Shopify token refresh failed: " + e.message);
  });
  if (!fresh.accessToken) throw new Error("Shopify token refresh returned no access token");
  const merged = { ...creds, ...fresh, shopDomain };
  await prisma.channel.update({
    where: { id: channel.id },
    data: { credentials: JSON.stringify(merged) },
  });
  return merged;
}

export async function getShopifyChannel(storeId: string) {
  return prisma.channel.findUnique({
    where: { storeId_type: { storeId, type: "shopify" } },
  });
}

export function getShopDomainFromChannel(channel: {
  credentials: string | null;
  name: string;
}): string {
  let raw = "";
  try {
    const creds = channel.credentials ? JSON.parse(channel.credentials) : {};
    if (creds.shopDomain) raw = creds.shopDomain;
  } catch {}
  if (!raw) {
    const m = channel.name.match(/\(([^)]+\.myshopify\.com)\)/);
    if (m) raw = m[1];
  }
  if (!raw) {
    const m2 = channel.name.match(/\(([^)]+)\)/);
    if (m2) raw = m2[1];
  }
  raw = raw.replace(/^https?:\/\//, "").split("/")[0];
  if (raw && !raw.includes(".myshopify.com")) raw = raw + ".myshopify.com";
  return raw;
}

async function paginate<T>(
  client: any,
  query: string,
  buildVars: (cursor: string | null) => { first: number; cursor: string | null },
  extractPage: (data: any) => { items: T[]; hasNext: boolean; endCursor: string | null }
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await client.request(query, { variables: buildVars(cursor) });
    const data = res.data || (res.body && res.body.data);
    const pageResult = extractPage(data);
    all.push(...pageResult.items);
    if (!pageResult.hasNext) break;
    cursor = pageResult.endCursor;
  }
  return all;
}

export async function syncShopifyCatalog(storeId: string, channel?: any): Promise<any> {
  const existing = channel || (await getShopifyChannel(storeId));
  if (!existing || existing.status !== "connected") {
    throw new Error("Shopify channel is not connected");
  }

  const shopDomain = getShopDomainFromChannel(existing);
  if (!shopDomain) {
    throw new Error("Shopify shop domain unknown");
  }

  const creds = await ensureFreshToken(existing);

  const client = getShopifyGraphqlClient(creds.accessToken, shopDomain);

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error("Store not found");

  let apiKey = store.apiKey;
  if (!apiKey) {
    apiKey =
      "cc_live_" +
      Array.from({ length: 32 }, () =>
        "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
      ).join("");
    await prisma.store.update({ where: { id: storeId }, data: { apiKey } });
  }

  let prevSettings: any = {};
  try {
    prevSettings = existing.settings ? JSON.parse(existing.settings) : {};
  } catch {}

  const policiesRes = await client.request(STORE_POLICIES_QUERY).catch((e: any) => {
    console.error("[Shopify] Store policies query failed (scope?):", e.message);
    return null;
  });
  const shopData = policiesRes
    ? (policiesRes.data || (policiesRes.body && policiesRes.body.data))?.shop || {}
    : {};
  const policyMap: Record<string, { title: string; body: string }> = {};
  for (const p of shopData.shopPolicies || []) {
    if (p && p.type) {
      const raw = String(p.type).toLowerCase();
      const key =
        raw === "terms_of_service"
          ? "terms"
          : raw.replace("_policy", "").replace("_of_service", "");
      if (key) policyMap[key] = { title: p.title || "", body: p.body || "" };
    }
  }
  const policies = {
    name: shopData.name || "",
    domain: shopData.myshopifyDomain || shopDomain,
    currency: shopData.currencyCode || "USD",
    refund: policyMap["refund"] || null,
    privacy: policyMap["privacy"] || null,
    terms: policyMap["terms"] || null,
    shipping: policyMap["shipping"] || null,
    returns: policyMap["returns"] || null,
  };

  const products = await paginate(
    client,
    PRODUCTS_QUERY,
    (cursor) => ({ first: PAGE_SIZE, cursor }),
    (data) => ({
      items: data?.products?.edges?.map((e: any) => e.node) || [],
      hasNext: !!data?.products?.pageInfo?.hasNextPage,
      endCursor: data?.products?.pageInfo?.endCursor || null,
    })
  );

  let inventory: any[] = [];
  try {
    inventory = await paginate(
      client,
      INVENTORY_QUERY,
      (cursor) => ({ first: PAGE_SIZE, cursor }),
      (data) => ({
        items: data?.inventoryItems?.edges?.map((e: any) => e.node) || [],
        hasNext: !!data?.inventoryItems?.pageInfo?.hasNextPage,
        endCursor: data?.inventoryItems?.pageInfo?.endCursor || null,
      })
    );
  } catch (e: any) {
    console.error("[Shopify] Inventory query failed (scope?):", e.message);
  }

  const inventoryByProductId = new Map<string, number>();
  const inventoryByVariantId = new Map<string, number>();
  const locations = new Set<string>();
  for (const item of inventory) {
    if (item.inventoryLevels?.edges?.length) {
      for (const level of item.inventoryLevels.edges) {
        locations.add(level.node.location?.name || level.node.location?.id || "");
        let available: number | null = null;
        for (const q of level.node.quantities || []) {
          if (String(q.name).toLowerCase() === "available") {
            available = q.quantity;
          }
        }
        if (available != null) {
          if (item.variant?.product?.id) {
            inventoryByProductId.set(
              item.variant.product.id,
              (inventoryByProductId.get(item.variant.product.id) || 0) + available
            );
          }
          if (item.variant?.id) {
            inventoryByVariantId.set(
              item.variant.id,
              (inventoryByVariantId.get(item.variant.id) || 0) + available
            );
          }
        }
      }
    }
  }

  const currency = policies.currency || "USD";
  const results = { fetched: 0, created: 0, updated: 0, deactivated: 0, skipped: 0, inventoryItems: inventory.length, locations: locations.size };

  const syncedProductIds: string[] = [];
  for (const p of products) {
    if (!p.title) {
      results.skipped++;
      continue;
    }
    const firstVariant = p.variants?.edges?.[0]?.node;
    const priceVariant =
      p.variants?.edges?.find((v: any) => v.node.availableForSale)?.node || firstVariant;
    const price = priceVariant?.price ? parseFloat(priceVariant.price) : 0;
    const stock =
      p.totalInventory != null
        ? p.totalInventory
        : inventoryByProductId.get(p.id) ?? (firstVariant?.inventoryQuantity ?? null);
    const url = "https://" + shopDomain + "/products/" + p.handle;
    const description = p.descriptionHtml ? p.descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : null;
    const image = p.featuredImage?.url || null;

    const existingProduct = await prisma.product.findFirst({
      where: { storeId, url },
      select: { id: true },
    });

    const data = {
      name: p.title,
      price,
      image,
      description: description || null,
      category: p.productType || p.vendor || null,
      stock: stock != null ? Number(stock) : null,
      currency,
      isActive: p.status === "ACTIVE",
      lastSynced: new Date(),
      slug: p.handle || null,
      url,
    };

    if (existingProduct) {
      await prisma.product.update({ where: { id: existingProduct.id }, data });
      results.updated++;
    } else {
      await prisma.product.create({ data: { ...data, storeId } });
      results.created++;
    }
    syncedProductIds.push(existingProduct?.id || "");
    results.fetched++;
  }

  const currentIds = syncedProductIds.filter(Boolean);
  const previousIds: string[] = Array.isArray(prevSettings.shopifyProductIds)
    ? prevSettings.shopifyProductIds
    : [];
  if (currentIds.length && previousIds.length) {
    const removed = previousIds.filter((id) => !currentIds.includes(id));
    if (removed.length) {
      await prisma.product.updateMany({
        where: { id: { in: removed } },
        data: { isActive: false },
      });
      results.deactivated += removed.length;
    }
  }

  const settings = {
    shopDomain,
    shopName: policies.name,
    currency,
    policies,
    shopifyProductIds: currentIds,
    widgetUrl: (process.env.NEXT_PUBLIC_URL || "https://chatbot.circucity.com") + "/api/widget?key=" + apiKey,
    lastSync: new Date().toISOString(),
    productCount: results.fetched,
    inventoryCount: results.inventoryItems,
  };

  await prisma.channel.update({
    where: { id: existing.id },
    data: { lastSyncAt: new Date(), settings: JSON.stringify(settings), errorMessage: null },
  });

  return { ...results, shopDomain, shopName: policies.name, currency, policies, widgetUrl: settings.widgetUrl };
}
