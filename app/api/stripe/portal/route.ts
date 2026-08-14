import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createBillingPortalSession, stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const store = await prisma.store.findFirst({
      where: { userId: session.id },
    });

    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = store.stripeCustomerId;
    if (!customerId) {
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      const customer = await stripe.customers.create({
        email: user?.email,
        name: user?.name || user?.email,
        metadata: { userId: session.id, storeId: store.id },
      });
      customerId = customer.id;
      await prisma.store.update({ where: { id: store.id }, data: { stripeCustomerId: customerId } });
    }

    const portalSession = await createBillingPortalSession(customerId);

    return NextResponse.json({ success: true, url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: error.message || "Failed to create portal session" }, { status: 500 });
  }
}
