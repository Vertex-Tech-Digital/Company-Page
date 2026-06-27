const Stripe = require("stripe");

// Importe mínimo y máximo permitidos (en céntimos) para el cobro variable.
const MIN_AMOUNT = 100; //   1,00 €
const MAX_AMOUNT = 5000000; // 50.000,00 €

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, amount } = req.body ?? {};

  // --- Validación ---
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Nombre inválido" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido" });
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
    //    (evita depender del auto-adjuntado de items "pendientes").
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: draft.id,
      amount: amountCents,
      currency,
      description: "Servicios Vertex Tech",
    });

    // 4) Finalizar la factura genera el PDF y el client_secret de pago.
    //    Al completarse el pago, Stripe envía la factura al email del cliente.
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
