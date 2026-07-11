const nodemailer = require("nodemailer");
const { Pool } = require("pg");
const { verifyAuth } = require("../_auth");
const {
  getCompany,
  calculateTotals,
  renderInvoicePdf,
  toEsDate,
} = require("../../server/invoice-pdf.js");

/*
 * Serverless Function (estilo Vercel) — POST /api/invoices/create
 *
 * Emite una factura: numeración correlativa atómica -> upsert del cliente ->
 * persiste en la tabla `invoices` -> genera el PDF (react-pdf) -> lo envía por
 * email al cliente con copia oculta (BCC) a la bandeja interna.
 *
 * El PDF NO se guarda: se regenera bajo demanda desde los datos (api/admin-invoices).
 * Protegido con el JWT del panel admin (`_auth.js`).
 */

/* ── Email con adjunto + BCC ─────────────────────────────────────────────────── */
async function sendInvoiceEmail({ to, bcc, invoiceNumber, language, companyName, pdf }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) throw new Error("Email service not configured");

  // Escape hatch SOLO para desarrollo tras un proxy/antivirus que intercepta TLS.
  // NUNCA activar en producción (no poner INVOICE_SMTP_INSECURE_TLS en Vercel).
  const insecureTls = process.env.INVOICE_SMTP_INSECURE_TLS === "true";
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
    ...(insecureTls ? { tls: { rejectUnauthorized: false } } : {}),
  });
  const copy =
    language === "en"
      ? { subject: `Invoice ${invoiceNumber}`, body: `Hello,\n\nPlease find attached invoice ${invoiceNumber} issued by ${companyName}.\n\nThank you for your business.\n\n— ${companyName}`, filename: "Invoice" }
      : { subject: `Factura ${invoiceNumber}`, body: `Hola,\n\nAdjuntamos la factura ${invoiceNumber} emitida por ${companyName}.\n\nGracias por confiar en nosotros.\n\n— ${companyName}`, filename: "Factura" };

  await transporter.sendMail({
    from: `"${companyName}" <${gmailUser}>`,
    to,
    bcc,
    subject: copy.subject,
    text: copy.body,
    attachments: [{ filename: `${copy.filename}-${invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
}

/* ── Validación ──────────────────────────────────────────────────────────────── */
function validate(body) {
  const client = body && body.client;
  if (!client || typeof client !== "object") return "Faltan los datos del cliente.";
  if (!client.legalName || String(client.legalName).trim().length < 2) return "Razón social inválida.";
  if (!client.nif || String(client.nif).trim().length < 1) return "NIF/CIF inválido.";
  if (!client.email || !String(client.email).includes("@")) return "Email de facturación inválido.";
  if (!client.address || String(client.address).trim().length < 1) return "Dirección inválida.";
  if (!Array.isArray(body.items) || body.items.length < 1) return "La factura necesita al menos una línea.";
  for (const it of body.items) {
    if (!it || String(it.description || "").trim().length < 1) return "Cada línea necesita descripción.";
    if (!Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0) return "Las cantidades deben ser mayores que 0.";
    if (!Number.isFinite(Number(it.unitPrice)) || Number(it.unitPrice) < 0) return "Precios unitarios inválidos.";
  }
  return null;
}

// Calcula el siguiente número VT-<AÑO>-<NNN> dentro de una transacción ya bloqueada.
async function nextInvoiceNumber(dbClient, year) {
  const prefix = `VT-${year}-`;
  const r = await dbClient.query(
    "SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1",
    [`${prefix}%`],
  );
  let seq = 1;
  if (r.rows.length) {
    const n = parseInt(String(r.rows[0].invoice_number).slice(prefix.length), 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = verifyAuth(req, res);
  if (!auth) return; // verifyAuth ya respondió 401

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const body = req.body || {};
  const error = validate(body);
  if (error) return res.status(400).json({ error });

  const company = getCompany();
  const language = body.language === "en" ? "en" : "es";
  const taxRate = Number.isFinite(Number(body.taxRate)) ? Number(body.taxRate) : 7;
  const client = {
    legalName: String(body.client.legalName).trim(),
    nif: String(body.client.nif).trim(),
    email: String(body.client.email).trim(),
    address: String(body.client.address).trim(),
  };
  const items = body.items.map((it) => ({
    description: String(it.description).trim(),
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
  }));
  const notes = body.notes ? String(body.notes) : undefined;
  const dueDate = body.dueDate ? String(body.dueDate) : null;
  const issueDate = new Date().toISOString().slice(0, 10);
  const totals = calculateTotals(items, taxRate);

  // ── Persistencia: numeración atómica + upsert cliente + insert factura ──────
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const dbClient = await pool.connect();
  let invoiceNumber;
  try {
    await dbClient.query("BEGIN");
    const year = new Date().getFullYear();
    // Serializa la numeración por año: garantiza correlativos sin huecos ni duplicados.
    await dbClient.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`invoices_${year}`]);

    invoiceNumber = await nextInvoiceNumber(dbClient, year);

    // Upsert del cliente por NIF (CRM mínimo).
    const upserted = await dbClient.query(
      `INSERT INTO clients (legal_name, nif, email, address)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (nif) DO UPDATE
         SET legal_name = EXCLUDED.legal_name, email = EXCLUDED.email,
             address = EXCLUDED.address, updated_at = now()
       RETURNING id`,
      [client.legalName, client.nif, client.email, client.address],
    );
    const clientId = upserted.rows[0].id;

    await dbClient.query(
      `INSERT INTO invoices
         (invoice_number, client_id, client_legal_name, client_nif, client_email,
          client_address, language, issue_date, due_date, items, tax_rate,
          subtotal, tax_amount, total, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'sent')`,
      [
        invoiceNumber, clientId, client.legalName, client.nif, client.email,
        client.address, language, issueDate, dueDate, JSON.stringify(items),
        taxRate, totals.subtotal, totals.taxAmount, totals.total,
      ],
    );

    await dbClient.query("COMMIT");
  } catch (err) {
    await dbClient.query("ROLLBACK").catch(() => {});
    console.error("Invoice persist error:", err);
    return res.status(500).json({ error: "No se pudo guardar la factura." });
  } finally {
    dbClient.release();
    await pool.end();
  }

  // ── PDF (regenerable desde los datos) ───────────────────────────────────────
  let pdf;
  try {
    pdf = await renderInvoicePdf({
      invoiceNumber,
      issueDate: toEsDate(issueDate),
      dueDate: dueDate ? toEsDate(dueDate) : undefined,
      language,
      company,
      client,
      items,
      taxRate,
      totals,
      notes,
    });
  } catch (err) {
    console.error("Invoice PDF error:", err);
    // La factura ya está guardada; se puede descargar/reenviar desde el listado.
    return res.status(200).json({
      invoiceNumber, status: "sent", issueDate,
      subtotal: totals.subtotal, taxAmount: totals.taxAmount, total: totals.total,
      emailSent: false, pdfError: true,
    });
  }

  // ── Email (best-effort: la factura ya está persistida) ──────────────────────
  let emailSent = true;
  try {
    await sendInvoiceEmail({
      to: client.email, bcc: company.bcc, invoiceNumber, language,
      companyName: company.companyName, pdf,
    });
  } catch (err) {
    console.error("Invoice email error:", err);
    emailSent = false;
  }

  return res.status(200).json({
    invoiceNumber,
    status: "sent",
    issueDate,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    total: totals.total,
    emailSent,
    pdfBase64: pdf.toString("base64"),
  });
};
