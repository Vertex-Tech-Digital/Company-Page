const Stripe = require("stripe");
const { pool } = require("../server/db.js");
const { createRateLimiter, getClientIp } = require("./_rate-limit.js");

// Importe mínimo y máximo permitidos (en céntimos) para el cobro variable.
const MIN_AMOUNT = 100; //   1,00 €
const MAX_AMOUNT = 5000000; // 50.000,00 €

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 5 intentos cada 10 min por IP: deja margen para que un pago legítimo con
// algún reintento de red pase sin problema, pero frena scripting/abuso.
const isRateLimited = createRateLimiter({ count: 5, windowMs: 10 * 60 * 1000 });

/**
 * Recupera el client_secret asociado a una factura ya finalizada.
 *
 * Stripe ha cambiado el nombre del campo entre versiones de la API: las
 * versiones recientes exponen `confirmation_secret`, las anteriores usaban
 * `payment_intent`. Intentamos ambos para no acoplarnos a una versión concreta.
 */
async function getInvoiceClientSecret(stripe, invoiceId) {
  try {
    const inv = await stripe.invoices.retrieve(invoiceId, {
      expand: ["confirmation_secret"],
    });
    if (inv.confirmation_secret && inv.confirmation_secret.client_secret) {
      return inv.confirmation_secret.client_secret;
    }
  } catch (_) {
    // El campo puede no existir en esta versión de la API: probamos el legacy.
  }

  try {
    const inv = await stripe.invoices.retrieve(invoiceId, {
      expand: ["payment_intent"],
    });
    if (inv.payment_intent && inv.payment_intent.client_secret) {
      return inv.payment_intent.client_secret;
    }
  } catch (_) {
    // Sin client_secret recuperable.
  }

  return null;
}

async function markOrderFailed(orderId) {
  try {
    await pool.query(
      "UPDATE payment_orders SET status = 'failed', updated_at = now() WHERE id = $1 AND status = 'pending'",
      [orderId],
    );
  } catch (err) {
    console.error("No se pudo marcar la orden como fallida:", err);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res
      .status(429)
      .json({ error: "Demasiados intentos. Inténtalo de nuevo más tarde." });
  }

  const { name, email, amount, idempotencyKey } = req.body ?? {};

  // --- Validación ---
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Nombre inválido" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido" });
  }
  if (typeof idempotencyKey !== "string" || !UUID_RE.test(idempotencyKey)) {
    return res.status(400).json({ error: "Solicitud inválida" });
  }

  // El importe llega en euros (number) y lo convertimos a céntimos en el servidor.
  const euros = Number(amount);
  if (!Number.isFinite(euros) || euros <= 0) {
    return res.status(400).json({ error: "Importe inválido" });
  }
  const amountCents = Math.round(euros * 100);
  if (amountCents < MIN_AMOUNT || amountCents > MAX_AMOUNT) {
    return res.status(400).json({
      error: `El importe debe estar entre ${MIN_AMOUNT / 100} € y ${MAX_AMOUNT / 100} €`,
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return res.status(500).json({ error: "Pasarela de pago no configurada" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const currency = (process.env.STRIPE_CURRENCY || "eur").toLowerCase();
  const stripe = new Stripe(secretKey);

  try {
    // --- Orden server-side: se crea (o recupera) ANTES de tocar Stripe ---
    // A partir de aquí, el importe/identidad que se usan son los de la fila
    // de `payment_orders`, no un req.body que el cliente pudiera reenviar
    // con otro valor.
    let order;
    const existing = await pool.query(
      "SELECT * FROM payment_orders WHERE client_idempotency_key = $1 LIMIT 1",
      [idempotencyKey],
    );

    if (existing.rows.length > 0) {
      order = existing.rows[0];

      // Reintento de una orden que ya llegó a tener factura de Stripe: no se
      // crea nada nuevo, se devuelve el mismo client_secret de siempre.
      if (order.stripe_invoice_id) {
        const clientSecret = await getInvoiceClientSecret(
          stripe,
          order.stripe_invoice_id,
        );
        if (clientSecret) {
          return res.status(200).json({ clientSecret });
        }
        // Si Stripe ya no puede darnos el secret (factura pagada/expirada),
        // seguimos abajo y devolvemos el error genérico de "no se pudo".
      }
      // Si no tiene stripe_invoice_id todavía, algo se cortó entre crear la
      // orden y terminar de hablar con Stripe en un intento anterior — se
      // reintenta con la MISMA fila (no se inserta una nueva).
    } else {
      try {
        const inserted = await pool.query(
          `INSERT INTO payment_orders
             (client_idempotency_key, name, email, amount_cents, currency, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING *`,
          [idempotencyKey, name.trim(), email.trim(), amountCents, currency],
        );
        order = inserted.rows[0];
      } catch (err) {
        // Carrera: dos requests con la misma idempotencyKey llegaron casi
        // a la vez. La que perdió el INSERT recupera la fila que sí se creó.
        if (err.code === "23505") {
          const retry = await pool.query(
            "SELECT * FROM payment_orders WHERE client_idempotency_key = $1 LIMIT 1",
            [idempotencyKey],
          );
          order = retry.rows[0];
        } else {
          throw err;
        }
      }
    }

    // 1) Cliente (los datos quedan asociados a la factura/recibo).
    const customer = await stripe.customers.create(
      { name: order.name, email: order.email },
      { idempotencyKey: `order-${order.id}:customer` },
    );

    // 2) Factura en borrador con cobro automático: se pagará con el Payment Element.
    const draft = await stripe.invoices.create(
      {
        customer: customer.id,
        collection_method: "charge_automatically",
        auto_advance: false,
        currency: order.currency,
      },
      { idempotencyKey: `order-${order.id}:invoice` },
    );

    // 3) Concepto a facturar, adjuntado explícitamente a esta factura
    //    (evita depender del auto-adjuntado de items "pendientes").
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        invoice: draft.id,
        amount: order.amount_cents,
        currency: order.currency,
        description: "Servicios Vertex Tech",
      },
      { idempotencyKey: `order-${order.id}:item` },
    );

    // 4) Finalizar la factura genera el PDF y el client_secret de pago.
    //    Al completarse el pago, Stripe envía la factura al email del cliente.
    await stripe.invoices.finalizeInvoice(draft.id, undefined, {
      idempotencyKey: `order-${order.id}:finalize`,
    });

    await pool.query(
      "UPDATE payment_orders SET stripe_customer_id = $1, stripe_invoice_id = $2, updated_at = now() WHERE id = $3",
      [customer.id, draft.id, order.id],
    );

    const clientSecret = await getInvoiceClientSecret(stripe, draft.id);
    if (!clientSecret) {
      console.error("No client_secret found for invoice", draft.id);
      await markOrderFailed(order.id);
      return res.status(500).json({ error: "No se pudo iniciar el pago" });
    }

    // NOTA: llegar aquí significa que se generó la factura y el
    // client_secret para pagarla — NO que el pago se haya completado. El
    // estado real (paid/failed/refunded) lo confirma únicamente el webhook
    // firmado de Stripe (api/stripe-webhook.js); nunca esta respuesta ni lo
    // que el cliente reporte después de llamar a stripe.confirmPayment().
    return res.status(200).json({ clientSecret });
  } catch (err) {
    console.error("Stripe invoice error:", err);
    return res.status(500).json({ error: "No se pudo iniciar el pago" });
  }
};
