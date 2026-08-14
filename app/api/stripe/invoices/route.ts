import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await requireAuth();

    const store = await prisma.store.findFirst({
      where: { userId: session.id },
      include: { subscriptions: { take: 1 } },
    });

    if (!store || !store.stripeCustomerId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const customerId = store.stripeCustomerId!;

    // Fetch recent invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 12,
    });

    const formatted = invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid / 100,
      currency: inv.currency.toUpperCase(),
      status: inv.status,
      date: new Date(inv.created * 1000).toISOString(),
      hostedUrl: inv.hosted_invoice_url,
      pdfUrl: inv.invoice_pdf,
      number: inv.number,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
