// POST /api/stripe-webhook
// Única fuente de verdad sobre el estado real de un cobro. El backend
// (create-payment-intent.js) solo sabe que INICIÓ un pago; el frontend
// (Checkout.tsx) solo sabe lo que Stripe.js le contó en el navegador. Ninguno
// de los dos confirma que el dinero efectivamente entró — eso solo lo sabe
// Stripe, y nos lo dice aquí, firmado.
//
// Requiere el body SIN parsear para poder verificar la firma
// (stripe.webhooks.constructEvent necesita los bytes exactos que Stripe
// firmó). Por eso desactivamos el bodyParser — ver dev-api-plugin.mjs para
// el equivalente en desarrollo local.

const Stripe = require("stripe");
const { pool } = require("../server/db.js");

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !secretKey) {
    console.error(
      "Stripe webhook no configurado (falta STRIPE_WEBHOOK_SECRET o STRIPE_SECRET_KEY)",
    );
    return res.status(500).json({ error: "Webhook no configurado" });
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL no configurada");
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    // Firma inválida o body corrupto: puede ser un reintento con el body
    // alterado, o simplemente alguien golpeando el endpoint sin ser Stripe.
    console.error("Firma de webhook inválida:", err.message);
    return res.status(400).json({ error: "Firma inválida" });
  }

  try {
    switch (event.type) {
      // La factura se cobró correctamente: esto es lo único que marca una
      // orden como realmente pagada.
      case "invoice.paid": {
        const invoice = event.data.object;
        await pool.query(
          "UPDATE payment_orders SET status = 'paid', updated_at = now() WHERE stripe_invoice_id = $1",
          [invoice.id],
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await pool.query(
          `UPDATE payment_orders SET status = 'failed', updated_at = now()
           WHERE stripe_invoice_id = $1 AND status = 'pending'`,
          [invoice.id],
        );
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        // Los charges generados al cobrar una factura llevan la referencia
        // a esa factura; sin ella no hay forma de saber a qué orden pertenece.
        if (charge.invoice) {
          await pool.query(
            "UPDATE payment_orders SET status = 'refunded', updated_at = now() WHERE stripe_invoice_id = $1",
            [charge.invoice],
          );
        }
        break;
      }

      default:
        // Evento de Stripe que no nos interesa para el estado de la orden.
        break;
    }
  } catch (err) {
    console.error(`Error procesando webhook ${event.type}:`, err);
    // 500 para que Stripe reintente la entrega de este evento más tarde.
    return res.status(500).json({ error: "Error interno" });
  }

  return res.status(200).json({ received: true });
};

// Debe asignarse DESPUÉS de `module.exports = handler`: si se hiciera antes,
// la reasignación de arriba pisaría este `.config` (module.exports pasa de
// ser {} a ser directamente la función).
module.exports.config = { api: { bodyParser: false } };
