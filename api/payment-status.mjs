import { json } from "./_lib/response.mjs";
import { query } from "./_lib/db.mjs";

export async function GET(request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");

  if (!sessionId) {
    return json(
      {
        error: "missing_session_id",
        message: "Parametro session_id mancante.",
      },
      400
    );
  }

  let result;
  try {
    result = await query(
      `
        select status, access_token, paid_at, consumed_at
        from public.checkout_unlocks
        where checkout_session_id = $1
        limit 1
      `,
      [sessionId]
    );
  } catch {
    return json(
      {
        error: "status_lookup_failed",
        message: "Impossibile recuperare lo stato del pagamento.",
      },
      500
    );
  }

  const data = result.rows[0];

  if (!data) {
    return json(
      {
        status: "not_found",
        unlocked: false,
        consumed: false,
      },
      404
    );
  }

  return json({
    status: data.status,
    unlocked: data.status === "paid",
    consumed: data.status === "consumed",
    paidAt: data.paid_at,
    consumedAt: data.consumed_at,
    accessToken: data.status === "paid" ? data.access_token : null,
  });
}
