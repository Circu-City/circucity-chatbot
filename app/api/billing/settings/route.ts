import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function PUT(req: Request) {
  try {
    const session = await requireAuth();
    const { storeId, billingCountry, businessType, vatNumber } = await req.json();
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    const store = await prisma.store.findFirst({ where: { id: storeId, userId: session.id } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        billingCountry: billingCountry || undefined,
        businessType: businessType || undefined,
        vatNumber: vatNumber || undefined,
      },
    });

    if (store.stripeCustomerId) {
      try {
        const customerData: any = {
          address: { country: billingCountry || undefined },
        };
        if (businessType === "business" && vatNumber) {
          customerData.tax_id_data = [{ type: "eu_vat", value: vatNumber }];
        }
        await stripe.customers.update(store.stripeCustomerId, customerData);
      } catch (e) {
        console.error("Stripe customer update failed:", e);
      }
    }

    return NextResponse.json({ success: true, store: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: session.id },
      select: {
        stripeCustomerId: true,
        billingCountry: true,
        businessType: true,
        vatNumber: true,
        name: true,
      },
    });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    return NextResponse.json({ store });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
