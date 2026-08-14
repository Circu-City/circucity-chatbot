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
        const { userId, storeId, product } = session.metadata || {};

        if (userId && storeId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const monthlyActive =
            subscription.status === "active" || subscription.status === "trialing";

          // Gavriel Listing AI — own entitlement, independent of the chatbot plan
          if (product === "listing") {
            const tier = getListingTierFromPriceId(subscription.items.data[0]?.price.id);
            if (!tier) {
              console.error("Webhook: unknown listing price id", subscription.items.data[0]?.price.id);
              break;
            }
            await prisma.storeProductEntitlement.upsert({
              where: { storeId_product: { storeId, product: "listing" } },
              create: {
                storeId,
                product: "listing",
                tier,
                status: monthlyActive ? "active" : subscription.status as any,
                priceId: subscription.items.data[0]?.price.id,
                stripeSubscriptionId: subscription.id,
              },
              update: {
                tier,
                status: monthlyActive ? "active" : subscription.status as any,
                priceId: subscription.items.data[0]?.price.id,
                stripeSubscriptionId: subscription.id,
              },
            });

            // Save latest payment method from the invoice (shared with store card)
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
            break;
          }

          const plan = getPlanFromPriceId(subscription.items.data[0]?.price.id);

          // Save/Update subscription
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

          // Update store plan
          await prisma.store.update({
            where: { id: storeId },
            data: { plan },
          });

          // Update organization plan
          const store = await prisma.store.findUnique({ where: { id: storeId }, select: { orgId: true } });
          if (store?.orgId) {
            await prisma.organization.update({
              where: { id: store.orgId },
              data: { plan },
            });
          }

          // Save payment method from invoice
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
          // Find store by stripe customer ID
          const store = await prisma.store.findFirst({
            where: { stripeCustomerId: invoice.customer as string },
          });
          if (store) {
            // Update subscription period
            const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
            await prisma.subscription.updateMany({
              where: { stripeId: sub.id },
              data: {
                status: "active",
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
              },
            });

            // Save latest payment method
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
        const monthlyActive =
          subscription.status === "active" || subscription.status === "trialing";

        // Gavriel Listing AI — own entitlement, independent of the chatbot plan
        const listingEnt = await prisma.storeProductEntitlement.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (listingEnt) {
        const tier = getListingTierFromPriceId(subscription.items.data[0]?.price.id);
        if (!tier) {
          console.error("Webhook: unknown listing price id", subscription.items.data[0]?.price.id);
          break;
        }
        await prisma.storeProductEntitlement.update({
            where: { id: listingEnt.id },
            data: {
              tier,
              status:
                subscription.status === "deleted" || subscription.status === "canceled"
                  ? "cancelled"
                  : monthlyActive
                    ? "active"
                    : (subscription.status as string),
              priceId: subscription.items.data[0]?.price.id,
            },
          });
          break;
        }

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

        // Sync plan to store and org
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
        console.log(`Unhandled event type: ${event.type}`);
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

function getListingTierFromPriceId(priceId: string | undefined): string {
  const priceMap: Record<string, any> = {
    [process.env.STRIPE_PRICE_LISTING_GROWTH || ""]: "growth",
    [process.env.STRIPE_PRICE_LISTING_PROFESSIONAL || ""]: "professional",
    [process.env.STRIPE_PRICE_LISTING_ENTERPRISE || ""]: "enterprise",
  };
  return priceMap[priceId || ""] || "growth";
}
