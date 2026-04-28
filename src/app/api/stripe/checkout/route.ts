import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PRO_PRICE_ID } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId;

  // Get or create the Stripe customer
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
  });

  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { orgId },
    });
    customerId = customer.id;

    // Save the customer ID
    await prisma.subscription.update({
      where: { orgId },
      data: { stripeCustomerId: customerId },
    });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.APP_URL}/settings/billing?canceled=true`,
    metadata: { orgId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
