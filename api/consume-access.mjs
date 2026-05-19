import { json, readJson } from "./_lib/response.mjs";
import { query } from "./_lib/db.mjs";

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return null;
  }

  return forwardedFor.split(",")[0].trim();
}

export async function POST(request) {
  const body = (await readJson(request)) || {};
  const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";

  if (!accessToken) {
    return json(
      {
        error: "missing_access_token",
        message: "Token di sblocco mancante.",
      },
      400
    );
  }

  const consumedAt = new Date().toISOString();
  const consumedByIp = getClientIp(request);

  let updateResult;
  try {
    updateResult = await query(
      `
        update public.checkout_unlocks
        set status = 'consumed',
            consumed_at = $1,
            consumed_by_ip = $2
        where access_token = $3
          and status = 'paid'
        returning id
      `,
      [consumedAt, consumedByIp, accessToken]
    );
  } catch {
    return json(
      {
        error: "consume_failed",
        message: "Impossibile consumare il diritto di utilizzo.",
      },
      500
    );
  }

  if (updateResult.rows[0]) {
    return json({
      ok: true,
      consumedAt,
    });
  }

  let existingResult;
  try {
    existingResult = await query(
      `
        select status
        from public.checkout_unlocks
        where access_token = $1
        limit 1
      `,
      [accessToken]
    );
  } catch {
    return json(
      {
        error: "consume_lookup_failed",
        message: "Impossibile verificare il token di sblocco.",
      },
      500
    );
  }

  const existing = existingResult.rows[0];

  if (!existing) {
    return json(
      {
        error: "unlock_not_found",
        message: "Token di sblocco non valido.",
      },
      404
    );
  }

  if (existing.status === "consumed") {
    return json(
      {
        error: "already_consumed",
        message: "Questo utilizzo e gia stato consumato.",
      },
      409
    );
  }

  return json(
    {
      error: "payment_not_completed",
      message: "Pagamento non ancora disponibile per il consumo.",
    },
    409
  );
}
