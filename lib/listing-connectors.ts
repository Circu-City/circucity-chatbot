import prisma from "@/lib/db";
import { convertSekToEur } from "@/lib/listing";
import { createHmac } from "crypto";

export type ConnectorListing = {
  title: string;
  description: string;
  category: string;
  condition: string;
  priceSek: number;
  estimatedAge: string;
  estimatedWeightKg: number;
  quantity: number;
  attributes: Record<string, string>;
  tags: string[];
};

export interface PublishResult {
  remoteId?: string;
  remoteUrl?: string;
  platform: string;
}

export type ChannelCreds = Record<string, any>;

export function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
  if (!match) throw new Error("Invalid image data");
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

function listingToTags(listing: ConnectorListing): string[] {
  return [...new Set(listing.tags.concat([listing.category]).filter(Boolean))].slice(0, 8);
}

export async function getChannel(storeId: string, type: string) {
  return prisma.channel.findUnique({
    where: { storeId_type: { storeId, type } },
  });
}

async function getCreds(storeId: string, type: string): Promise<ChannelCreds> {
  const channel = await getChannel(storeId, type);
  if (!channel || channel.status !== "connected") {
    throw Object.assign(new Error(`${type} is not connected. Connect it in the Listings app first.`), { status: 400 });
  }
  try {
    return JSON.parse(channel.credentials || "{}");
  } catch {
    throw new Error(`${type} store credentials are corrupted; reconnect the store.`);
  }
}

// ---------------------------------------------------------------------------
// Shopify — OAuth-connected store → draft product via Admin GraphQL
// ---------------------------------------------------------------------------
import "@shopify/shopify-api/adapters/node";
import { getShopifyGraphqlClient } from "@/lib/shopify/client";

export async function publishToShopify(storeId: string, listing: ConnectorListing, images: string[]): Promise<PublishResult> {
  const creds = await getCreds(storeId, "shopify");
  const accessToken = creds.accessToken;
  const shopDomain = creds.shopDomain;
  if (!accessToken || !shopDomain) throw new Error("Missing Shopify access token. Reconnect the store.");

  const client = getShopifyGraphqlClient(accessToken, shopDomain.replace(/^https?:\/\//, "").replace(/\.myshopify\.com$/i, ""));
  const price = Number(listing.priceSek) || 0;

  const createMutation = `mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product { id title status variants(first: 1) { edges { node { id inventoryItem { id } } } } }
      userErrors { field message }
    }
  }`;
  const createVars = {
    input: {
      title: listing.title,
      productType: listing.category.slice(0, 255),
      descriptionHtml: listing.description ? `<p>${listing.description.replace(/</g, "&lt;")}</p>` : undefined,
      status: "DRAFT",
      tags: listingToTags(listing).join(", "),
      variants: [{ price: String(price), inventoryPolicy: "DENY" }],
    },
  };

  const created = await client.request(createMutation, { variables: createVars });
  const errors = created?.data?.productCreate?.userErrors || [];
  if (errors.length) throw new Error(errors.map((e: any) => e.message).join("; "));
  const product = created?.data?.productCreate?.product;
  if (!product?.id) throw new Error("Shopify did not return a product id");

  if (listing.quantity > 0) {
    try {
      const variant = product?.variants?.edges?.[0]?.node;
      if (variant?.inventoryItem?.id) {
        const locationsRes = await client.request(`query { locations(first: 10) { edges { node { id } } } }`);
        const locationId = locationsRes?.data?.locations?.edges?.[0]?.node?.id;
        if (locationId) {
          const inventoryResult = await client.request(
            `mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
              inventorySetQuantities(input: $input) { userErrors { field message } }
            }`,
            {
              variables: {
                input: {
                  name: "available",
                  reason: "correction",
                  quantities: [{ inventoryItemId: variant.inventoryItem.id, locationId, quantity: listing.quantity }],
                },
              },
            },
          );
          const inventoryErrors = inventoryResult?.data?.inventorySetQuantities?.userErrors || [];
          if (inventoryErrors.length) {
            console.error("[Shopify] Inventory set warning:", inventoryErrors.map((e: any) => e.message).join("; "));
          }
        }
      }
    } catch (error) {
      // Product is in a valid state either way — surface but don't fail.
      console.error("[Shopify] Inventory set warning:", error instanceof Error ? error.message : error);
    }
  }

  if (images.length > 0) {
    const mediaMutation = `mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id }
        userErrors { field message }
      }
    }`;
    const mediaResult = await client.request(mediaMutation, {
      variables: {
        input: {
          id: product.id,
          media: images.slice(0, 4).map((src, index) => ({
            mediaContentType: "IMAGE",
            originalSource: src,
            position: index + 1,
          })),
        },
      },
    });
    const mediaErrors = mediaResult?.data?.productUpdate?.userErrors || [];
    if (mediaErrors.length) {
      // Product is in a valid state either way — surface but don't fail.
      console.error("[Shopify] Media attach warning:", mediaErrors.map((e: any) => e.message).join("; "));
    }
  }

  return {
    remoteId: product.id.replace("gid://shopify/Product/", ""),
    remoteUrl: `https://${shopDomain.replace(/^https?:\/\//, "")}/admin/products/${product.id.replace("gid://shopify/Product/", "")}`,
    platform: "shopify",
  };
}

// ---------------------------------------------------------------------------
// WooCommerce — REST API with consumer key/secret, best-effort media upload
// ---------------------------------------------------------------------------
export async function publishToWooCommerce(storeId: string, listing: ConnectorListing, images: string[]): Promise<PublishResult> {
  const creds = await getCreds(storeId, "woocommerce");
  const { shopUrl, consumerKey, consumerSecret } = creds;
  if (!shopUrl || !consumerKey || !consumerSecret) throw new Error("WooCommerce credentials incomplete. Reconnect the store.");

  const base = `${shopUrl.replace(/\/+$/, "")}/wp-json`;
  const auth = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`;

  const imageIds: number[] = [];
  for (const src of images.slice(0, 4)) {
    try {
      const { buffer, mime } = dataUrlToBuffer(src);
      const mediaRes = await fetch(`${base}/wp/v2/media`, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": mime },
        body: buffer,
        signal: AbortSignal.timeout(30_000),
      });
      if (mediaRes.ok) {
        const media = await mediaRes.json();
        if (media?.id) imageIds.push(media.id);
      }
    } catch {
      // A listing without photos is better than none — continue.
    }
  }

  const body = {
    name: listing.title,
    type: "simple",
    status: "draft",
    description: listing.description,
    short_description: listing.category,
    regular_price: String(listing.priceSek),
    stock_quantity: Math.max(1, listing.quantity),
    manage_stock: true,
    categories: listing.category ? [{ name: listing.category.slice(0, 60) }] : undefined,
    tags: listingToTags(listing).map((tag) => ({ name: tag.slice(0, 60) })),
    meta_data: [
      { key: "_circucity_condition", value: listing.condition },
      { key: "_circucity_estimated_age", value: listing.estimatedAge },
      { key: "_circucity_ai_listing", value: "yes" },
    ],
    ...(imageIds.length ? { images: imageIds.map((id) => ({ id })) } : {}),
  };

  const res = await fetch(`${base}/wc/v3/products`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(result?.data) ? result.data.map((e: any) => e.message).join("; ") : result?.message || JSON.stringify(result).slice(0, 300);
    throw new Error(`WooCommerce rejected the product: ${msg}`);
  }
  if (!result?.id) throw new Error("WooCommerce did not return a product id");

  return {
    remoteId: String(result.id),
    remoteUrl: `${shopUrl.replace(/\/+$/, "")}/wp-admin/post.php?post=${result.id}&action=edit`,
    platform: "woocommerce",
  };
}

// ---------------------------------------------------------------------------
// eBay — Inventory API: policies → inventory item → fixed-price offer
// ---------------------------------------------------------------------------
const EBAY_API = "https://api.ebay.com/sell";

async function ebayRequest(path: string, options: { method?: string; token: string; body?: unknown }): Promise<any> {
  const res = await fetch(`${EBAY_API}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Language": "en-US",
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`eBay API ${res.status}: ${data?.errors?.[0]?.message || data?.raw || "request failed"}`);
  }
  return data;
}

async function ensureEbayPolicy(creds: ChannelCreds, marketplaceId: string, kind: "payment" | "return" | "fulfillment"): Promise<string> {
  const token = creds.accessToken;
  const listRes = await ebayRequest(`/account/v1/${kind}_policy?marketplace_id=${marketplaceId}`, { token });
  if (Array.isArray(listRes) && listRes.length > 0) return listRes[0].paymentPolicyId || listRes[0].returnPolicyId || listRes[0].fulfillmentPolicyId;
  if (listRes?.[kind === "payment" ? "paymentPolicies" : `${kind}Policies`]?.length) {
    const arr = listRes[kind === "payment" ? "paymentPolicies" : `${kind}Policies`];
    return arr[0][`${kind}PolicyId`];
  }
  const body: any = { name: `CircuCity ${kind} policy`, marketPlaceIds: [marketplaceId] };
  if (kind === "payment") body.paymentMethods = [{ name: "PAYPAL" }];
  if (kind === "return") {
    body.returnsAccepted = true;
    body.returnDuration = "DAYS_30";
  }
  if (kind === "fulfillment") body.handlingTime = { unit: "DAY", value: 1 };
  const created = await ebayRequest(`/account/v1/${kind}_policy`, { method: "POST", token, body });
  return created.paymentPolicyId || created.returnPolicyId || created.fulfillmentPolicyId;
}

async function ensureEbayCategoryId(token: string, marketplaceId: string, category: string): Promise<string> {
  try {
    const treeRes = await ebayRequest(`/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${marketplaceId}`, { token });
    const treeId = treeRes?.categoryTreeId;
    if (treeId) {
      const suggestions = await ebayRequest(
        `/commerce/taxonomy/v1/category_tree/${treeId}/get_category_suggestions?q=${encodeURIComponent(category)}`,
        { token },
      );
      const first = suggestions?.categorySuggestions?.[0]?.category;
      if (first?.categoryId) return String(first.categoryId);
    }
  } catch {
    // fall back to the generic default below
  }
  return marketplaceId === "EBAY_SE" ? "81598" : "11116"; // Other/General per marketplace
}

export async function publishToEbay(storeId: string, listing: ConnectorListing, images: string[]): Promise<PublishResult> {
  const creds = await getCreds(storeId, "ebay");
  const token = creds.accessToken;
  if (!token) throw new Error("Missing eBay access token. Reconnect the store.");
  const marketplaceId = creds.marketplaceId || "EBAY_SE";

  const fx = await convertSekToEur(listing.priceSek);
  if (!fx) throw new Error("Could not convert SEK → EUR for the eBay listing (FX service unavailable). Please publish to a SEK currency platform or retry.");

  const [paymentPolicyId, returnPolicyId, fulfillmentPolicyId, categoryId] = await Promise.all([
    ensureEbayPolicy(creds, marketplaceId, "payment"),
    ensureEbayPolicy(creds, marketplaceId, "return"),
    ensureEbayPolicy(creds, marketplaceId, "fulfillment"),
    ensureEbayCategoryId(token, marketplaceId, listing.category),
  ]);

  const sku = `CIRCUCITY-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const imageUrls = images.filter((src) => /^https?:\/\//.test(src)); // eBay needs public URLs, not data URLs

  await ebayRequest(`/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    method: "PUT",
    token,
    body: {
      product: {
        title: listing.title.slice(0, 80),
        description: listing.description,
        imageUrls: imageUrls.length ? imageUrls.slice(0, 4) : undefined,
        aspects: Object.entries(listing.attributes).slice(0, 15).map(([name, value]) => ({ name, value }),
        ),
      },
      condition: listing.condition === "new" ? "NEW" : "USED",
      packageWeightAndSize: { weight: { value: String(listing.estimatedWeightKg), unit: "KILOGRAM" } },
      availability: { shipToLocationAvailability: { quantity: Math.max(1, listing.quantity) } },
    },
  });

  const offer = await ebayRequest(`/inventory/v1/offer`, {
    method: "POST",
    token,
    body: {
      sku,
      marketplaceId,
      format: "FIXED_PRICE",
      availableQuantity: Math.max(1, listing.quantity),
      categoryId,
      price: { value: String(fx.value), currency: fx.currency },
      listing: { title: listing.title.slice(0, 80) },
      listingDescription: listing.description,
      listingPolicies: {
        paymentPolicyId,
        returnPolicyId,
        fulfillmentPolicyId,
      },
    },
  });

  const offerId = offer?.offerId;
  if (!offerId) throw new Error("eBay created the offer but returned no offer id");

  return { remoteId: String(sku), remoteUrl: `https://ebay.com/itm/${offerId}`, platform: "ebay" };
}

// ---------------------------------------------------------------------------
// Etsy — OAuth2 (PKCE) connected shop → draft listing + image upload
// ---------------------------------------------------------------------------
export async function publishToEtsy(storeId: string, listing: ConnectorListing, images: string[]): Promise<PublishResult> {
  const creds = await getCreds(storeId, "etsy");
  const token = creds.accessToken;
  const shopId = creds.shopId;
  const apiKey = process.env.ETSY_API_KEY;
  if (!apiKey) throw new Error("Etsy API key is not configured on the server.");
  if (!token || !shopId) throw new Error("Etsy store is not fully connected. Reconnect from the Listings app.");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "x-api-key": apiKey,
  };

  let taxonomyId: string | null = null;
  try {
    const tax = await fetch(
      `https://openapi.etsy.com/v3/application/taxonomy/categories?tag=${encodeURIComponent(listing.category)}&limit=1`,
      { headers },
    ).then((r) => r.json());
    taxonomyId = tax?.results?.[0]?.taxonomy_id ?? null;
  } catch {
    /* fall through */
  }
  if (!taxonomyId) throw new Error("Could not map this category to an Etsy taxonomy. Pick a different category in the draft and re-publish.");

  const createRes = await fetch(`https://openapi.etsy.com/v3/application/shops/${shopId}/listings`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      quantity: Math.max(1, listing.quantity),
      title: listing.title.slice(0, 140),
      description: listing.description,
      price: String(listing.priceSek),
      currency_code: "SEK",
      taxonomy_id: Number(taxonomyId),
      who_made: "i_did",
      when_made: "2020_2024",
      is_personalizable: false,
      type: "physical",
      tags: listingToTags(listing).map((t) => t.slice(0, 20)).join(","),
      should_auto_renew: false,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const created = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    const err = Array.isArray(created?.error_messages) ? created.error_messages.join("; ") : created?.title || JSON.stringify(created).slice(0, 300);
    throw new Error(`Etsy rejected the listing: ${err}`);
  }
  const listingId = created?.listing_id;
  if (!listingId) throw new Error("Etsy did not return a listing id");

  if (images.length > 0) {
    const { buffer, mime } = dataUrlToBuffer(images[0]);
    const form = new FormData();
    form.append("image", new Blob([buffer], { type: mime }), "listing.jpg");
    const imageRes = await fetch(`https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}/images`, {
      method: "POST",
      headers: headers,
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
    if (!imageRes.ok) {
      const imgErr = await imageRes.text();
      throw new Error(`Etsy accepted the listing but image upload failed: ${imgErr.slice(0, 200)}`);
    }
  }

  return {
    remoteId: String(listingId),
    remoteUrl: `https://www.etsy.com/shop/${creds.shopName || "yourshop"}/listing/${listingId}`,
    platform: "etsy",
  };
}

// ---------------------------------------------------------------------------
// Webhook / API — signed HTTP push of the full listing payload
// ---------------------------------------------------------------------------
export async function publishToWebhook(url: string, secret: string, listing: ConnectorListing, images: string[]): Promise<PublishResult> {
  if (!/^https?:\/\//.test(url)) {
    throw Object.assign(new Error("Webhook URL must start with http(s)://"), { status: 400 });
  }
  const payload = JSON.stringify({
    event: "listing.created",
    id: `circucity-${Date.now()}`,
    ...listing,
    attributes: listing.attributes,
    images: images.slice(0, 4),
    createdAt: new Date().toISOString(),
  });

  const signature = secret ? createHmac("sha256", secret).update(payload).digest("hex") : undefined;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "CircuCityGrowthSuite/1.0",
      ...(signature ? { "X-CircuCity-Signature": `sha256=${signature}` } : {}),
    },
    body: payload,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Webhook responded ${res.status} — ${(await res.text()).slice(0, 200)}`);

  return { remoteId: null, remoteUrl: url, platform: "webhook" };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
export async function publishListing(
  platform: string,
  storeId: string,
  listing: ConnectorListing,
  images: string[],
  target?: { webhookUrl?: string; webhookSecret?: string },
): Promise<PublishResult> {
  switch (platform) {
    case "shopify":
      return publishToShopify(storeId, listing, images);
    case "woocommerce":
      return publishToWooCommerce(storeId, listing, images);
    case "ebay":
      return publishToEbay(storeId, listing, images);
    case "etsy":
      return publishToEtsy(storeId, listing, images);
    case "webhook":
      if (!target?.webhookUrl) throw new Error("A webhook URL is required for webhook publishing");
      return publishToWebhook(target.webhookUrl, target.webhookSecret || "", listing, images);
    default:
      throw new Error(`Unknown publish target: ${platform}`);
  }
}

// Verify a WooCommerce connect attempt before saving it.
export async function verifyWooCredentials(shopUrl: string, consumerKey: string, consumerSecret: string): Promise<void> {
  const base = `${shopUrl.replace(/\/+$/, "")}/wp-json`;
  const auth = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`;
  const res = await fetch(`${base}/wc/v3/products?per_page=1`, {
    headers: { Authorization: auth },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data?.data) ? data.data.map((e: any) => e.message).join("; ") : (data?.message || `HTTP ${res.status}`);
    throw new Error(`WooCommerce connection failed: ${msg}`);
  }
}