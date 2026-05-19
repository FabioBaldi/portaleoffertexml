import { json } from "./_lib/response.mjs";
import { getStripe, getStripeWebhookSecret } from "./_lib/stripe.mjs";
import { query } from "./_lib/db.mjs";

async function persistSessionState(session, nextStatus) {
  const checkoutSessionId = session.id;
  const accessToken = session.metadata?.access_token || null;
  const now = new Date().toISOString();

  const existingResult = await query(
    `
      select id, status
      from public.checkout_unlocks
      where checkout_session_id = $1
      limit 1
    `,
    [checkoutSessionId]
  );
  const existing = existingResult.rows[0];

  const basePayload = {
    accessToken,
    customerEmail: session.customer_details?.email || session.customer_email || null,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
  };

  if (!existing) {
    await query(
      `
        insert into public.checkout_unlocks (
          checkout_session_id,
          access_token,
          status,
          customer_email,
          amount_total,
          currency,
          paid_at
        )
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        checkoutSessionId,
        basePayload.accessToken,
        nextStatus,
        basePayload.customerEmail,
        basePayload.amountTotal,
        basePayload.currency,
        nextStatus === "paid" ? now : null,
      ]
    );
    return;
  }

  if (existing.status === "consumed" && nextStatus === "paid") {
    await query(
      `
        update public.checkout_unlocks
        set access_token = $1,
            customer_email = $2,
            amount_total = $3,
            currency = $4
        where id = $5
      `,
      [
        basePayload.accessToken,
        basePayload.customerEmail,
        basePayload.amountTotal,
        basePayload.currency,
        existing.id,
      ]
    );
    return;
  }

  await query(
    `
      update public.checkout_unlocks
      set access_token = $1,
          customer_email = $2,
          amount_total = $3,
          currency = $4,
          status = $5,
          paid_at = case when $5 = 'paid' then coalesce(paid_at, $6) else paid_at end
      where id = $7
    `,
    [
      basePayload.accessToken,
      basePayload.customerEmail,
      basePayload.amountTotal,
      basePayload.currency,
      nextStatus,
      now,
      existing.id,
    ]
  );
}

export async function POST(request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return json({ error: "missing_signature" }, 400);
  }

  let event;

  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    return json(
      {
        error: "invalid_signature",
        message: error.message,
      },
      400
    );
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      if (session.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded") {
        await persistSessionState(session, "paid");
      }
    }

    if (event.type === "checkout.session.expired") {
      await persistSessionState(event.data.object, "expired");
    }

    if (event.type === "checkout.session.async_payment_failed") {
      await persistSessionState(event.data.object, "failed");
    }
  } catch (error) {
    return json(
      {
        error: "webhook_processing_failed",
        message: error.message || "Errore durante la sincronizzazione del webhook.",
      },
      500
    );
  }

  return json({ received: true });
}
