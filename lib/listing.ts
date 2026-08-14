import prisma from "@/lib/db";

export const LISTING_TIERS: string[] = ["free", "growth", "professional", "enterprise"];

export const LISTING_PLAN_LIMITS: Record<string, number | null> = {
  free: 10,
  starter: 10,
  growth: 500,
  professional: 5000,
  scale: 2000,
  enterprise: null,
};

export const LISTING_PUBLISH_TIERS: Record<string, boolean> = {
  free: false,
  starter: false,
  growth: true,
  professional: true,
  scale: true,
  enterprise: true,
};

export async function getStoreForUser(userId: string) {
  return prisma.store.findFirst({
    where: { userId },
    include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}

/**
 * Gavriel Listing AI entitlement for a user's store. Every store has exactly one
 * row per product. Missing rows resolve to the "free" tier so unpublished stores
 * keep the free quota and no publishing.
 *
 * Per-product entitlements mean buying Gavriel never touches the chatbot plan and
 * vice versa — a store keyed by the listing product only, its tier and Stripe
 * subscription id.
 */
export async function getListingEntitlement(userId: string) {
  const store = await prisma.store.findFirst({
    where: { userId },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      entitlements: { where: { product: "listing" } },
    },
  });
  if (!store) return { store: null, tier: "free", status: "active" as const };

  let entitlement = store.entitlements[0];
  if (!entitlement) {
    // Legacy back-compat: before entitlements existed, listing access was implied by
    // the chatbot plan. Preserve that so existing paying customers don't regress.
    const subscription = store.subscriptions[0];
    const paidActive =
      subscription &&
      (subscription.status === "active" || subscription.status === "trialing") &&
      (subscription.plan === "growth" ||
        subscription.plan === "scale" ||
        subscription.plan === "enterprise");
    const legacyTier =
      paidActive && subscription.plan === "enterprise"
        ? "enterprise"
        : paidActive && (subscription.plan === "growth" || subscription.plan === "scale")
          ? "growth"
          : "free";
    return { store, tier: legacyTier, status: "active" as const, legacy: true };
  }

  return { store, tier: entitlement.tier, status: entitlement.status as string };
}

export async function getEffectivePlan(userId: string): Promise<string> {
  // Kept for backward compatibility — chatbot billing uses store.plan/subscriptions.
  const store = await getStoreForUser(userId);
  if (!store) return "free";
  const subscription = store.subscriptions[0];
  const paidActive =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    (subscription.plan === "growth" || subscription.plan === "scale" || subscription.plan === "enterprise");
  return paidActive ? subscription.plan : store.plan || "free";
}

export async function getListingQuota(userId: string): Promise<{ used: number; limit: number | null; plan: string }> {
  const { store, tier } = await getListingEntitlement(userId);
  const plan = tier || "free";
  if (!store) return { used: 0, limit: LISTING_PLAN_LIMITS[plan] ?? null, plan };
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const used = await prisma.listingRecord.count({
    where: { storeId: store.id, createdAt: { gte: startOfMonth } },
  });
  return { used, limit: LISTING_PLAN_LIMITS[plan] ?? null, plan };
}

export function quotaError(q: { used: number; limit: number | null; plan: string }): Error {
  return Object.assign(
    new Error(
      `Plan limit reached (${q.used}/${q.limit} AI listings this month). Upgrade Gavriel for 500/month to keep analysing.`,
    ),
    { status: 429 },
  );
}

export async function assertListingQuota(userId: string): Promise<{ used: number; limit: number | null; plan: string }> {
  const quota = await getListingQuota(userId);
  if (quota.limit !== null && quota.used >= quota.limit) throw quotaError(quota);
  return quota;
}

export async function assertCanPublish(userId: string): Promise<string> {
  const { tier, status } = await getListingEntitlement(userId);
  if (!LISTING_PUBLISH_TIERS[tier] || status !== "active") {
    throw Object.assign(
      new Error("Publishing to stores requires Gavriel Listing AI (from €29/month). Unlock Gavriel to publish real drafts."),
      { status: 403 },
    );
  }
  return tier;
}

export async function convertSekToEur(sek: number): Promise<{ value: number; currency: string; rate: number } | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/SEK", { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const rate = Number(data?.rates?.EUR);
    if (rate && Number.isFinite(rate) && rate > 0) {
      return { value: Math.round(sek * rate * 100) / 100, currency: "EUR", rate };
    }
  } catch {
    /* live FX unavailable — try fallback below */
  }
  const fallback = Number(process.env.FX_SEK_EUR_FALLBACK);
  if (fallback && Number.isFinite(fallback) && fallback > 0) {
    return { value: Math.round(sek * fallback * 100) / 100, currency: "EUR", rate: fallback };
  }
  return null;
}