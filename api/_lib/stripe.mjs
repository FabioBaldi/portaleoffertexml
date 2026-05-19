import Stripe from "stripe";
import { requireEnv } from "./env.mjs";

let stripeInstance;

export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  }
  return stripeInstance;
}

export function getStripeWebhookSecret() {
  return requireEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripePriceId() {
  return requireEnv("STRIPE_PRICE_ID");
}
