import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createCheckoutSession, getListingPriceIdForTier, getPriceIdForPlan, stripe } from "@/lib/stripe";
import { LISTING_TIERS } from "@/lib/listing";

const FREE_PLANS = ["starter", "free"];
const LISTING_FREE_TIERS = ["free"];

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { product, plan, tier } = body;

    // ── Gavriel Listing AI ────────────────────────────────────────────────
    // Separate product with its own price and entitlement. Never touches the
    // chatbot plan/subscription.
    if (product === "listing") {
      const listingTier = String(tier || plan || "free").toLowerCase();
      if (!LISTING_TIERS.includes(listingTier)) {
        return NextResponse.json({ error: "Invalid Gavriel tier" }, { status: 400 });
      }

      let store = await prisma.store.findFirst({ where: { userId: session.id } });
      if (!store) {
        const user = await prisma.user.findUnique({ where: { id: session.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        store = await prisma.store.create({
          data: {
            userId: session.id,
            name: user.name || "My Store",
            subscriptions: { create: { plan: "free", status: "free" } },
            embedSettings: { create: {} },
          },
        });
      }

      // Free tier — no Stripe, just set the entitlement directly
      if (LISTING_FREE_TIERS.includes(listingTier)) {
        const existing = await prisma.storeProductEntitlement.findUnique({
          where: { storeId_product: { storeId: store.id, product: "listing" } },
        });
        if (existing && existing.tier !== "free" && existing.status === "active") {
          return NextResponse.json(
            { error: "Cannot downgrade a paid Gavriel plan. Cancel it first in your billing settings." },
            { status: 400 },
          );
        }
        await prisma.storeProductEntitlement.upsert({
          where: { storeId_product: { storeId: store.id, product: "listing" } },
          create: {
            storeId: store.id,
            product: "listing",
            tier: "free",
            status: "active",
          },
          update: { tier: "free", status: "active" },
        });
        return NextResponse.json({ success: true, url: "/dashboard?tab=listing" });
      }

      const priceId = getListingPriceIdForTier(listingTier);
      if (!priceId) {
        return NextResponse.json(
          { error: `Gavriel ${listingTier} price not configured on the server yet` },
          { status: 400 },
        );
      }

      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      let customerId = store.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || user.email,
          metadata: { userId: session.id, storeId: store.id },
        });
        customerId = customer.id;
        await prisma.store.update({ where: { id: store.id }, data: { stripeCustomerId: customerId } });
      }

      const checkoutSession = await createCheckoutSession({
        userId: session.id,
        storeId: store.id,
        priceId,
        customerEmail: user.email!,
        customerId,
        product: "listing",
      });

      return NextResponse.json({ success: true, url: checkoutSession.url });
    }

    // ── Chatbot billing (unchanged) ───────────────────────────────────────
    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    const normalized = plan.toLowerCase();

    // Free plans — no Stripe, just update the subscription directly
    if (FREE_PLANS.includes(normalized)) {
      let store = await prisma.store.findFirst({ where: { userId: session.id } });
      if (!store) {
        const user = await prisma.user.findUnique({ where: { id: session.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        store = await prisma.store.create({
          data: {
            userId: session.id,
            name: user.name || "My Store",
            subscriptions: { create: { plan: "free", status: "free" } },
            embedSettings: { create: {} },
          },
        });
      } else {
        await prisma.subscription.updateMany({
          where: { storeId: store.id },
          data: { plan: "free", status: "free" },
        });
        await prisma.store.update({ where: { id: store.id }, data: { plan: "free" } });
      }
      return NextResponse.json({ success: true, url: "/dashboard?tab=billing" });
    }

    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan or price not configured" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let store = await prisma.store.findFirst({
      where: { userId: session.id },
      include: { subscriptions: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          userId: session.id,
          name: user.name || "My Store",
          subscriptions: { create: { plan: "free", status: "free" } },
          embedSettings: { create: {} },
        },
        include: { subscriptions: { take: 1, orderBy: { createdAt: "desc" } } },
      });
    }

    // Get or create Stripe customer
    let customerId = store.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.email,
        metadata: { userId: session.id, storeId: store.id },
      });
      customerId = customer.id;
      await prisma.store.update({ where: { id: store.id }, data: { stripeCustomerId: customerId } });
    }

    // Sync store billing info to Stripe Customer before checkout
    if (store.billingCountry || store.vatNumber) {
      try {
        const custUpdate: any = {};
        if (store.billingCountry) custUpdate.address = { country: store.billingCountry };
        if (store.businessType === "business" && store.vatNumber) {
          custUpdate.tax_id_data = [{ type: "eu_vat", value: store.vatNumber }];
        }
        await stripe.customers.update(customerId, custUpdate);
      } catch (e) {
        console.warn("Could not sync billing info to Stripe:", e);
      }
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.id,
      storeId: store.id,
      priceId,
      customerEmail: user.email!,
      customerId,
    });

    return NextResponse.json({ success: true, url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
