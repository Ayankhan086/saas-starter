import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/**
 * The Stripe Price ID for the Pro plan.
 * Create a product + recurring price in your Stripe dashboard
 * and paste the price ID here.
 *
 * For testing, you can create one via:
 *   stripe products create --name="Pro Plan"
 *   stripe prices create --product=prod_xxx --unit-amount=2900 --currency=usd --recurring[interval]=month
 */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "price_placeholder";
