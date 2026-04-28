import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

/**
 * Stripe Webhook Handler
 *
 * Receives events from Stripe and updates the local Subscription record.
 * Must use the raw body for signature verification — do NOT parse JSON manually.
 *
 * Test locally with:
 *   stripe listen --forward-to localhost:3000/api/webhook
 *   stripe trigger checkout.session.completed
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[WEBHOOK_SIGNATURE_ERROR]", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[STRIPE_WEBHOOK] Event received: ${event.type}`);

  try {
    switch (event.type) {
      // ── Checkout completed → Upgrade to PRO ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;

        if (!orgId) {
          console.error("[WEBHOOK] Missing orgId in checkout session metadata");
          break;
        }

        // Retrieve the full subscription object
        const subResponse = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const stripeSub = subResponse as unknown as Stripe.Subscription;

        // Get period end from the first subscription item
        const firstItem = stripeSub.items?.data?.[0];
        const periodEnd = firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000)
          : null;

        await prisma.subscription.update({
          where: { orgId },
          data: {
            plan: "PRO",
            status: "ACTIVE",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId: firstItem?.price.id ?? null,
            currentPeriodEnd: periodEnd,
          },
        });

        console.log(`[WEBHOOK] ✅ Org ${orgId} upgraded to PRO`);
        break;
      }

      // ── Invoice paid → Renew subscription ──
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find the org by Stripe customer ID
        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (sub && sub.stripeSubscriptionId) {
          const subResponse = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
          const stripeSub = subResponse as unknown as Stripe.Subscription;
          const firstItem = stripeSub.items?.data?.[0];
          const periodEnd = firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null;

          await prisma.subscription.update({
            where: { orgId: sub.orgId },
            data: {
              status: "ACTIVE",
              currentPeriodEnd: periodEnd,
            },
          });
          console.log(`[WEBHOOK] ✅ Org ${sub.orgId} subscription renewed`);
        }
        break;
      }

      // ── Subscription deleted → Downgrade to FREE ──
      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;
        const customerId = deletedSub.customer as string;

        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { orgId: sub.orgId },
            data: {
              plan: "FREE",
              status: "CANCELED",
              stripeSubscriptionId: null,
              stripePriceId: null,
              currentPeriodEnd: null,
            },
          });
          console.log(`[WEBHOOK] ⬇️ Org ${sub.orgId} downgraded to FREE`);
        }
        break;
      }

      // ── Payment failed → Mark past due ──
      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const customerId = failedInvoice.customer as string;

        const sub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { orgId: sub.orgId },
            data: { status: "PAST_DUE" },
          });
          console.log(`[WEBHOOK] ⚠️ Org ${sub.orgId} payment failed`);
        }
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[WEBHOOK_HANDLER_ERROR]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
