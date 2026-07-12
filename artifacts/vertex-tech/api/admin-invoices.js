// GET /api/admin-invoices            -> lista de facturas emitidas (metadatos)
// GET /api/admin-invoices?id=5&pdf=1 -> regenera y devuelve el PDF (base64) de esa factura
//
// El PDF no se almacena: se regenera al vuelo desde los datos guardados.
// Requiere: Authorization: Bearer <token>

const { pool } = require("../server/db.js");
const { verifyAuth } = require("./_auth");
const { getCompany, renderInvoicePdf, toEsDate } = require("../server/invoice-pdf.js");

// Lee un parámetro de la query. En `pnpm dev` el plugin no rellena req.query,
// así que lo parseamos de req.url (funciona igual en Vercel).
function queryParam(req, name) {
  try {
    return new URL(req.url, "http://localhost").searchParams.get(name);
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  const payload = verifyAuth(req, res);
  if (!payload) return;

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const id = queryParam(req, "id");
    const wantPdf = queryParam(req, "pdf");

    // ── Regenerar el PDF de una factura concreta ──────────────────────────────
    if (id && wantPdf) {
      const r = await pool.query("SELECT * FROM invoices WHERE id = $1 LIMIT 1", [Number(id)]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Factura no encontrada" });
      const inv = r.rows[0];

      const totals = {
        subtotal: Number(inv.subtotal),
        taxAmount: Number(inv.tax_amount),
        total: Number(inv.total),
      };
      const pdf = await renderInvoicePdf({
        invoiceNumber: inv.invoice_number,
        issueDate: toEsDate(inv.issue_date),
        dueDate: inv.due_date ? toEsDate(inv.due_date) : undefined,
        language: inv.language,
        company: getCompany(),
        client: {
          legalName: inv.client_legal_name,
          nif: inv.client_nif,
          email: inv.client_email,
          address: inv.client_address,
        },
        items: inv.items, // jsonb -> ya es un array
        taxRate: Number(inv.tax_rate),
        totals,
      });
      return res.status(200).json({ invoiceNumber: inv.invoice_number, pdfBase64: pdf.toString("base64") });
    }

    // ── Listado de facturas emitidas ──────────────────────────────────────────
    const r = await pool.query(
      `SELECT id, invoice_number, client_legal_name, client_nif, issue_date,
              due_date, total, status, created_at
       FROM invoices
       ORDER BY id DESC`,
    );
    return res.status(200).json({ invoices: r.rows });
  } catch (err) {
    console.error("Error en admin-invoices:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
