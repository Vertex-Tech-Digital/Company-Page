const Stripe = require("stripe");
const {
  enforceBodyLimit,
  paymentIntentPreSchema,
  paymentIntentPostSchema,
  normalizePaymentIntentInput,
  formatZodError,
} = require("./_validation");

// Importe mínimo y máximo permitidos (en céntimos) para el cobro variable.
const MIN_AMOUNT = 100; //   1,00 €
const MAX_AMOUNT = 5000000; // 50.000,00 €

/**
 * Recupera el client_secret asociado a una factura ya finalizada.
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Límite de tamaño del body
  if (!enforceBodyLimit(req, res)) return;

  // 2. Validación pre-normalización (tipos y límites crudos)
  const preResult = paymentIntentPreSchema.safeParse(req.body ?? {});
  if (!preResult.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: formatZodError(preResult.error),
    });
  }

  // 3. Normalización y saneamiento
  const normalized = normalizePaymentIntentInput(preResult.data);

  // 4. Validación post-normalización (email válido, importes finitos y acotados)
  const postResult = paymentIntentPostSchema.safeParse(normalized);
  if (!postResult.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: formatZodError(postResult.error),
    });
  }

  const { name, email, amount: euros } = postResult.data;
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

  const currency = (process.env.STRIPE_CURRENCY || "eur").toLowerCase();
  const stripe = new Stripe(secretKey);

  try {
    // 1) Cliente (los datos quedan asociados a la factura/recibo).
    const customer = await stripe.customers.create({
      name: name.trim(),
      email: email.trim(),
    });

    // 2) Factura en borrador con cobro automático: se pagará con el Payment Element.
    const draft = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "charge_automatically",
      auto_advance: false,
      currency,
    });

    // 3) Concepto a facturar, adjuntado explícitamente a esta factura
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: draft.id,
      amount: amountCents,
      currency,
      description: "Servicios Vertex Tech",
    });

    // 4) Finalizar la factura genera el PDF y el client_secret de pago.
    await stripe.invoices.finalizeInvoice(draft.id);

    const clientSecret = await getInvoiceClientSecret(stripe, draft.id);
    if (!clientSecret) {
      console.error("No client_secret found for invoice", draft.id);
      return res.status(500).json({ error: "No se pudo iniciar el pago" });
    }

    return res.status(200).json({ clientSecret });
  } catch (err) {
    console.error("Stripe invoice error:", err);
    return res.status(500).json({ error: "No se pudo iniciar el pago" });
  }
};
