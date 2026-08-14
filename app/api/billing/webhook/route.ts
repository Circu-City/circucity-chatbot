import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/db";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, storeId } = session.metadata || {};

        if (userId && storeId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const plan = getPlanFromPriceId(subscription.items.data[0]?.price.id);

          await prisma.subscription.upsert({
            where: { stripeId: subscription.id },
            update: {
              status: subscription.status as any,
              plan,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              stripePriceId: subscription.items.data[0]?.price.id,
            },
            create: {
              storeId,
              stripeId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id,
              status: subscription.status as any,
              plan,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });

          await prisma.store.update({
            where: { id: storeId },
            data: { plan },
          });

          const store = await prisma.store.findUnique({ where: { id: storeId }, select: { orgId: true } });
          if (store?.orgId) {
            await prisma.organization.update({
              where: { id: store.orgId },
              data: { plan },
            });
          }

          if (session.invoice) {
            const invoice = await stripe.invoices.retrieve(session.invoice as string);
            if (invoice.payment_intent) {
              const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent as string);
              if (pi.payment_method && typeof pi.payment_method === "string") {
                const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
                await prisma.store.update({
                  where: { id: storeId },
                  data: {
                    stripePaymentMethodId: pm.id,
                    cardBrand: pm.card?.brand || null,
                    cardLast4: pm.card?.last4 || null,
                    cardExpMonth: pm.card?.exp_month || null,
                    cardExpYear: pm.card?.exp_year || null,
                  },
                });
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.customer) {
          const store = await prisma.store.findFirst({
            where: { stripeCustomerId: invoice.customer as string },
          });
          if (store) {
            const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
            await prisma.subscription.updateMany({
              where: { stripeId: sub.id },
              data: {
                status: "active",
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
              },
            });

            if (invoice.payment_intent && typeof invoice.payment_intent === "string") {
              const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent);
              if (pi.payment_method && typeof pi.payment_method === "string") {
                const pm = await stripe.paymentMethods.retrieve(pi.payment_method);
                await prisma.store.update({
                  where: { id: store.id },
                  data: {
                    stripePaymentMethodId: pm.id,
                    cardBrand: pm.card?.brand || null,
                    cardLast4: pm.card?.last4 || null,
                    cardExpMonth: pm.card?.exp_month || null,
                    cardExpYear: pm.card?.exp_year || null,
                  },
                });
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const plan = getPlanFromPriceId(subscription.items.data[0]?.price.id);

        await prisma.subscription.updateMany({
          where: { stripeId: subscription.id },
          data: {
            status: subscription.status as any,
            plan,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            stripePriceId: subscription.items.data[0]?.price.id,
          },
        });

        const subRecord = await prisma.subscription.findFirst({ where: { stripeId: subscription.id } });
        if (subRecord) {
          await prisma.store.update({ where: { id: subRecord.storeId }, data: { plan } });
          const store = await prisma.store.findUnique({ where: { id: subRecord.storeId }, select: { orgId: true } });
          if (store?.orgId) {
            await prisma.organization.update({ where: { id: store.orgId }, data: { plan } });
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

function getPlanFromPriceId(priceId: string | undefined): string {
  const priceMap: Record<string, any> = {
    [process.env.STRIPE_PRICE_STARTER || ""]: "starter",
    [process.env.STRIPE_PRICE_GROWTH || ""]: "growth",
    [process.env.STRIPE_PRICE_SCALE || ""]: "scale",
    [process.env.STRIPE_PRICE_ENTERPRISE || ""]: "enterprise",
  };
  return priceMap[priceId || ""] || "starter";
}

