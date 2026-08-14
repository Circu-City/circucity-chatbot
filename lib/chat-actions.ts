import type { ProductResult } from "@/lib/product-search";
import type { FlowState } from "@/lib/session-metadata";
import { fetchShippingRates, formatShippingComparison } from "@/lib/shipping-rates";
import { subscribeStockAlert } from "@/lib/stock-alerts";

export type ChatAction =
  | {
      type: "add_to_cart";
      productId: string;
      name: string;
      price: number;
      image?: string | null;
      url?: string | null;
      weight?: number;
    }
  | {
      type: "shipping_comparison";
      postnord: number;
      shipmondo: number;
      currency: string;
      weightKg: number;
    }
  | { type: "open_checkout"; url: string; carrier?: string }
  | { type: "collect_email"; reason: "stock_alert"; productName: string }
  | { type: "stock_alert_subscribed"; email: string; productName: string };

export type ActionResult = {
  actions: ChatAction[];
  flowUpdate: FlowState | null;
  replyOverride?: string;
  customerEmail?: string;
};

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

export function extractMarketplaceId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/\/products\/([^/?#]+)/);
  return m ? m[1] : null;
}

function pickProduct(
  products: ProductResult[],
  flow: FlowState | null,
): ProductResult | null {
  if (!products.length) return null;
  if (flow?.marketplaceProductId) {
    const match = products.find(
      (p) => extractMarketplaceId(p.url) === flow.marketplaceProductId || p.id === flow.marketplaceProductId,
    );
    if (match) return match;
  }
  return products[0];
}

export async function processChatActions(params: {
  message: string;
  products: ProductResult[];
  flow: FlowState | null;
  storeId: string;
  websiteUrl: string | null;
  customerEmail?: string | null;
  isPageProductQuery?: boolean;
}): Promise<ActionResult> {
  const { message, products, storeId, websiteUrl } = params;
  const msg = message.trim();
  const lower = msg.toLowerCase();
  let flow = params.flow ? { ...params.flow } : ({} as FlowState);
  const actions: ChatAction[] = [];
  let replyOverride: string | undefined;
  let customerEmail = params.customerEmail || undefined;

  const emailInMessage = msg.match(EMAIL_RE)?.[0];
  if (emailInMessage) customerEmail = emailInMessage;

  // --- Stock alert email capture ---
  if (flow.pendingFlow === "stock_email" && emailInMessage && flow.productName) {
    const product = pickProduct(products, flow);
    await subscribeStockAlert({
      storeId,
      email: emailInMessage,
      productId: product?.id || flow.marketplaceProductId || "unknown",
      productName: flow.productName,
      marketplaceProductId: flow.marketplaceProductId,
    });
    actions.push({
      type: "stock_alert_subscribed",
      email: emailInMessage,
      productName: flow.productName,
    });
    flow.pendingFlow = null;
    replyOverride =
      `Thanks — I've registered ${emailInMessage} for a restock alert on **${flow.productName}**. ` +
      `I'll notify you when it's back in stock.`;
    return { actions, flowUpdate: flow, replyOverride, customerEmail };
  }

  // --- Shipping carrier selection ---
  if (
    flow.pendingFlow === "shipping_pick" ||
    /(?:go with|choose|pick|use|prefer|take)\s+(?:shipmondo|postnord)/i.test(msg) ||
    /^(?:shipmondo|postnord)\s*(?:please|thanks)?\.?$/i.test(lower)
  ) {
    const carrier = /shipmondo/i.test(msg)
      ? "shipmondo"
      : /postnord/i.test(msg)
        ? "postnord"
        : flow.selectedCarrier;
    if (carrier) {
      flow.selectedCarrier = carrier;
      flow.pendingFlow = null;
      const label = carrier === "shipmondo" ? "Shipmondo" : "PostNord";
      const rate = flow.shippingRates?.[carrier];
      replyOverride =
        `Great — I've noted **${label}**` +
        (rate ? ` (${rate} SEK)` : "") +
        `. When you're ready, say "proceed to checkout" and I'll take you to payment.`;
      return { actions, flowUpdate: flow, replyOverride, customerEmail };
    }
  }

  // --- Checkout / payment ---
  if (
    /(?:proceed|continue|go)\s+(?:to\s+)?(?:checkout|payment|pay)/i.test(msg) ||
    /(?:ready to|want to)\s+(?:pay|checkout|complete)/i.test(msg)
  ) {
    const base = (websiteUrl || "https://circucity.com").replace(/\/+$/, "");
    const carrier = flow.selectedCarrier || "postnord";
    const checkoutUrl = `${base}/cart?carrier=${carrier}`;
    actions.push({ type: "open_checkout", url: checkoutUrl, carrier });
    replyOverride =
      `I'll take you to checkout with **${carrier === "shipmondo" ? "Shipmondo" : "PostNord"}** shipping selected. ` +
      `You can review your cart and complete payment there.`;
    return { actions, flowUpdate: flow, replyOverride, customerEmail };
  }

  // --- Explicit missing product (e.g. gaming laptops) ---
  if (
    /gaming\s+laptop|gaming\s+pc/i.test(msg) &&
    !products.some((p) => /gaming|laptop/i.test(p.name + " " + (p.description || "")))
  ) {
    replyOverride =
      "We don't carry gaming laptops specifically. I would suggest browsing our **Green Gadgets** category for refurbished tech, " +
      "or tell me your budget and I can find the closest match. " +
      "Would you like me to compare options, check policies, or narrow this down to your budget and use case?";
    return { actions, flowUpdate: flow, replyOverride, customerEmail };
  }

  // --- Add to cart ---
  if (
    /(?:add|put)\s+.*?(?:to|in)\s+(?:my\s+)?cart/i.test(msg) ||
    /(?:i(?:'ll| will)|let me)\s+take\s+(?:it|this|that|the|the\s+\w+)/i.test(msg) ||
    /(?:buy|purchase)\s+(?:it|this|that|the)\b/i.test(msg)
  ) {
    const product = pickProduct(products, flow);
    if (product) {
      const mpId = extractMarketplaceId(product.url) || product.id;
      flow.marketplaceProductId = mpId;
      flow.productName = product.name;
      actions.push({
        type: "add_to_cart",
        productId: mpId,
        name: product.name,
        price: product.price,
        image: product.image,
        url: product.url,
        weight: 0.5,
      });
      replyOverride =
        `I've added **${product.name}** (${product.price} ${product.currency || "SEK"}) to your cart. ` +
        `Would you like me to compare PostNord vs Shipmondo shipping, or proceed to checkout?`;
      return { actions, flowUpdate: flow, replyOverride, customerEmail };
    }
  }

  // --- Shipping comparison ---
  if (
    /(?:shipping|delivery)\s*(?:cost|price|rate|option)/i.test(msg) ||
    /how much.*(?:ship|deliver)/i.test(msg) ||
    /shipmondo|postnord/i.test(msg) ||
    /compare.*(?:shipping|carrier)/i.test(msg)
  ) {
    const weightKg = 1;
    const rates = websiteUrl
      ? await fetchShippingRates(websiteUrl, weightKg)
      : { postnord: 85.36, shipmondo: 81.09, weightKg: 1, currency: "SEK" };
    flow.shippingRates = {
      postnord: rates.postnord,
      shipmondo: rates.shipmondo,
      weightKg: rates.weightKg,
    };
    flow.pendingFlow = "shipping_pick";
    actions.push({
      type: "shipping_comparison",
      postnord: rates.postnord,
      shipmondo: rates.shipmondo,
      currency: rates.currency,
      weightKg: rates.weightKg,
    });
    replyOverride = formatShippingComparison(rates);
    return { actions, flowUpdate: flow, replyOverride, customerEmail };
  }

  // --- Stock notification request (skip when asking about current page product) ---
  if (
    !params.isPageProductQuery &&
    (/(?:notify\s+me|alert\s+me|tell\s+me\s+when)/i.test(msg) ||
    /(?:back\s+in\s+stock|restock|when.*(?:available|in\s+stock))/i.test(msg) ||
    /(?:out\s+of\s+stock|sold\s+out)/i.test(msg))
  ) {
    const product = pickProduct(products, flow);
    const name = product?.name || flow.productName || "that item";
    flow.productName = name;
    if (product) {
      flow.marketplaceProductId = extractMarketplaceId(product.url) || product.id;
    }

    if (customerEmail || emailInMessage) {
      const email = (emailInMessage || customerEmail)!;
      await subscribeStockAlert({
        storeId,
        productId: product?.id || flow.marketplaceProductId || "unknown",
        productName: name,
        email,
        marketplaceProductId: flow.marketplaceProductId,
      });
      actions.push({ type: "stock_alert_subscribed", email, productName: name });
      replyOverride =
        `I've registered **${email}** for a restock alert on **${name}**. You'll be notified when it's available again.`;
      return { actions, flowUpdate: flow, replyOverride, customerEmail: email };
    }

    flow.pendingFlow = "stock_email";
    actions.push({ type: "collect_email", reason: "stock_alert", productName: name });
    replyOverride =
      `I can notify you when **${name}** is back in stock. What email address should I use?`;
    return { actions, flowUpdate: flow, replyOverride, customerEmail };
  }

  return { actions: [], flowUpdate: Object.keys(flow).length ? flow : null, customerEmail };
}