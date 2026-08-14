import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set. Stripe features will not work.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  growth: process.env.STRIPE_PRICE_GROWTH || "",
  scale: process.env.STRIPE_PRICE_SCALE || "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "",
};

// Gavriel Listing AI is billed as its own product/subscription so a store owner
// can pay for the chatbot, the listing product, or both independently.
export const LISTING_PRICE_IDS = {
  growth: process.env.STRIPE_PRICE_LISTING_GROWTH || "",
  professional: process.env.STRIPE_PRICE_LISTING_PROFESSIONAL || "",
  enterprise: process.env.STRIPE_PRICE_LISTING_ENTERPRISE || "",
};

export function getPriceIdForPlan(plan: string): string {
  const normalized = plan.toLowerCase();
  if (normalized.includes("scale")) return STRIPE_PRICE_IDS.scale;
  if (normalized.includes("growth")) return STRIPE_PRICE_IDS.growth;
  if (normalized.includes("enterprise")) return STRIPE_PRICE_IDS.enterprise;
  return STRIPE_PRICE_IDS.starter;
}

export function getListingPriceIdForTier(tier: string): string {
  return LISTING_PRICE_IDS[tier as keyof typeof LISTING_PRICE_IDS] || "";
}

export function getListingTierFromPriceId(priceId: string | undefined): string | null {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_LISTING_GROWTH || ""]: "growth",
    [process.env.STRIPE_PRICE_LISTING_PROFESSIONAL || ""]: "professional",
    [process.env.STRIPE_PRICE_LISTING_ENTERPRISE || ""]: "enterprise",
  };
  return priceMap[priceId || ""] ?? null;
}

export async function createCheckoutSession({
  userId,
  storeId,
  priceId,
  customerEmail,
  customerId,
  product,
}: {
  userId: string;
  storeId: string;
  priceId: string;
  customerEmail?: string;
  customerId?: string;
  product?: string;
}) {
  const opts: any = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?tab=billing&success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?tab=billing`,
    metadata: { userId, storeId, product: product || "chatbot" },
    subscription_data: { metadata: { userId, storeId, product: product || "chatbot" }, trial_period_days: 14 },
    automatic_tax: { enabled: true },
  };
  if (customerId) {
    opts.customer = customerId;
    opts.customer_update = { address: "auto", name: "auto" };
  } else if (customerEmail) {
    opts.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(opts);
  return session;
}

export async function createBillingPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?tab=billing`,
  });
  return session;
}

export async function reportUsageToStripe(subscriptionItemId: string, quantity: number, timestamp?: Date) {
  if (!stripe || !subscriptionItemId) return;
  try {
    await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: timestamp ? Math.floor(timestamp.getTime() / 1000) : undefined,
      action: "increment",
    });
  } catch (error) {
    console.error("Failed to report usage to Stripe:", error);
  }
}
