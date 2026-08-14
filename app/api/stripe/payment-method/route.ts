import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await requireAuth();

    const store = await prisma.store.findFirst({
      where: { userId: session.id },
    });

    if (!store) {
      return NextResponse.json({ success: true, data: null });
    }

    // First, check if we have saved card data from webhook
    if (store.cardBrand && store.cardLast4) {
      return NextResponse.json({
        success: true,
        data: {
          brand: store.cardBrand,
          last4: store.cardLast4,
          exp_month: store.cardExpMonth,
          exp_year: store.cardExpYear,
        },
      });
    }

    // Fallback: try to fetch from Stripe directly
    if (store.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(store.stripeCustomerId, {
          expand: ["invoice_settings.default_payment_method"],
        });

        if (!customer.deleted && customer.invoice_settings?.default_payment_method) {
          const pm = customer.invoice_settings.default_payment_method as any;
          if (pm.card) {
            return NextResponse.json({
              success: true,
              data: {
                brand: pm.card.brand,
                last4: pm.card.last4,
                exp_month: pm.card.exp_month,
                exp_year: pm.card.exp_year,
              },
            });
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    console.error("Fetch payment method error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
