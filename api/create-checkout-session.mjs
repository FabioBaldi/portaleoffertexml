import { randomUUID } from "node:crypto";
import { getBaseUrl } from "./_lib/env.mjs";
import { json, readJson } from "./_lib/response.mjs";
import { getStripe, getStripePriceId } from "./_lib/stripe.mjs";
import { query } from "./_lib/db.mjs";

function buildAccessToken() {
  return `${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`;
}

export async function POST(request) {
  try {
    const body = (await readJson(request)) || {};
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    const accessToken = buildAccessToken();
    const baseUrl = getBaseUrl(request);
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: getStripePriceId(),
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      success_url: `${baseUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?payment=cancelled`,
      metadata: {
        access_token: accessToken,
        product_code: "xml_single_use",
      },
      payment_intent_data: {
        metadata: {
          access_token: accessToken,
          product_code: "xml_single_use",
        },
      },
    });

    await query(
      `
        insert into public.checkout_unlocks (
          checkout_session_id,
          access_token,
          status,
          customer_email,
          amount_total,
          currency
        )
        values ($1, $2, 'pending', $3, $4, $5)
      `,
      [
        session.id,
        accessToken,
        customerEmail || null,
        session.amount_total ?? null,
        session.currency ?? null,
      ]
    );

    return json({
      url: session.url,
      checkoutSessionId: session.id,
    });
  } catch (error) {
    return json(
      {
        error: "checkout_session_create_failed",
        message: error.message || "Impossibile avviare il checkout.",
      },
      500
    );
  }
}
