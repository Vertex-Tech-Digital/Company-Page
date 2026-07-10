const nodemailer = require("nodemailer");
const React = require("react");
const { LOGO_JPG_BASE64 } = require("../../server/vertex-logo.js");

/*
 * Serverless Function (estilo Vercel) — POST /api/invoices/create
 *
 * MVP del Entregable A: valida datos del cliente -> genera PDF de factura
 * (react-pdf, bilingüe ES/EN, con logo y datos fiscales de Vertex) -> lo envía
 * por email al cliente con copia oculta (BCC) a la bandeja interna.
 *
 * Compatible con `pnpm dev` (dev-api-plugin.mjs) y con el despliegue de Vercel.
 * react-pdf es ESM, por eso se carga con import() dinámico desde este módulo CJS.
 *
 * TODO(DB): no persiste en base de datos todavía. Bloqueado por (1) la tabla
 * `clients` que define Rigo y (2) falta DATABASE_URL. Ver TODO(DB) en la numeración.
 * TODO(AUTH): esta ruta no está protegida; proteger con el login del Entregable B.
 */

/* ── Datos fiscales del emisor (configurables por env, NO quemados) ─────────── */
function getCompany() {
  const env = process.env;
  return {
    companyName: env.INVOICE_COMPANY_NAME || "Vertex Tech Digital — en constitución",
    nif: env.INVOICE_NIF || "[NIF pendiente de alta]",
    address: env.INVOICE_ADDRESS || "El Fraile, Arona, Santa Cruz de ***REMOVED***",
    iae: env.INVOICE_IAE || "[IAE pendiente de alta]",
    email: env.INVOICE_EMAIL || "***REMOVED***",
    bcc: env.INVOICE_BCC || "***REMOVED***",
  };
}

/* ── Numeración correlativa VT-<AÑO>-<NNN> ──────────────────────────────────── */
// TODO(DB): contador en memoria. En serverless se reinicia en cada cold start,
// así que NO es correlativo real ni válido fiscalmente. Cuando exista la tabla
// `invoices` + DATABASE_URL, sustituir por un incremento atómico en Postgres
// (secuencia o SELECT ... FOR UPDATE sobre el último número del año).
let inMemoryCounter = 0;
function getNextInvoiceNumber(year) {
  inMemoryCounter += 1;
  return `VT-${year}-${String(inMemoryCounter).padStart(3, "0")}`;
}

/* ── Totales ────────────────────────────────────────────────────────────────── */
function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
function calculateTotals(items, taxRate) {
  const subtotal = round2(items.reduce((a, it) => a + it.quantity * it.unitPrice, 0));
  const taxAmount = round2(subtotal * (taxRate / 100));
  return { subtotal, taxAmount, total: round2(subtotal + taxAmount) };
}

/* ── i18n ES/EN ─────────────────────────────────────────────────────────────── */
const LABELS = {
  es: { invoice: "FACTURA", number: "Nº de factura", issueDate: "Fecha de emisión", dueDate: "Fecha de vencimiento", billedTo: "Facturar a", nif: "NIF/CIF", description: "Descripción", quantity: "Cant.", unitPrice: "Precio unit.", lineTotal: "Importe", subtotal: "Base imponible", tax: "IVA", total: "Total", notes: "Notas", iae: "Epígrafe IAE", locale: "es-ES" },
  en: { invoice: "INVOICE", number: "Invoice no.", issueDate: "Issue date", dueDate: "Due date", billedTo: "Billed to", nif: "Tax ID", description: "Description", quantity: "Qty", unitPrice: "Unit price", lineTotal: "Amount", subtotal: "Subtotal", tax: "VAT", total: "Total", notes: "Notes", iae: "Business activity code", locale: "en-GB" },
};
function money(value, locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(value);
}

/* ── Render del PDF con react-pdf (import dinámico: es ESM) ──────────────────── */
async function renderInvoicePdf(data) {
  const { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } = await import(
    "@react-pdf/renderer"
  );
  const h = React.createElement;
  const t = LABELS[data.language];
  const c = data.company;
  const fmt = (v) => money(v, t.locale);

  const COLORS = { ink: "#0d1117", muted: "#6b7280", border: "#e5e7eb", accent: "#2563eb", zebra: "#f9fafb" };
  const s = StyleSheet.create({
    page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 44, fontSize: 10, color: COLORS.ink, fontFamily: "Helvetica" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
    logo: { width: 80, height: 80, objectFit: "contain", marginBottom: 8 },
    companyName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
    companyMeta: { color: COLORS.muted, marginTop: 3, maxWidth: 240 },
    invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: COLORS.accent, textAlign: "right" },
    metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
    metaLabel: { color: COLORS.muted, textAlign: "right" },
    metaValue: { fontFamily: "Helvetica-Bold", marginLeft: 8, textAlign: "right" },
    billedBox: { marginBottom: 22, padding: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 4 },
    sectionLabel: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
    clientName: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    clientMeta: { color: COLORS.muted, marginTop: 2 },
    tableHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.ink, paddingBottom: 6, marginBottom: 2 },
    row: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    cellDesc: { flex: 5 },
    cellQty: { flex: 1, textAlign: "right" },
    cellUnit: { flex: 2, textAlign: "right" },
    cellAmount: { flex: 2, textAlign: "right" },
    headText: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase" },
    totals: { marginTop: 16, alignSelf: "flex-end", width: 240 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totalsLabel: { color: COLORS.muted },
    grandRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.ink },
    grandLabel: { fontFamily: "Helvetica-Bold", fontSize: 12 },
    grandValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: COLORS.accent },
    notes: { marginTop: 26 },
    notesText: { color: COLORS.muted, lineHeight: 1.5 },
    footer: { position: "absolute", bottom: 28, left: 44, right: 44, textAlign: "center", color: COLORS.muted, fontSize: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  });

  const emitterBlock = h(View, null,
    data.logo ? h(Image, { style: s.logo, src: { data: data.logo, format: "jpg" } }) : null,
    h(Text, { style: s.companyName }, c.companyName),
    h(Text, { style: s.companyMeta }, `${t.nif}: ${c.nif}`),
    h(Text, { style: s.companyMeta }, c.address),
    h(Text, { style: s.companyMeta }, c.email),
    h(Text, { style: s.companyMeta }, `${t.iae}: ${c.iae}`),
  );

  const titleBlock = h(View, null,
    h(Text, { style: s.invoiceTitle }, t.invoice),
    h(View, { style: s.metaRow }, h(Text, { style: s.metaLabel }, `${t.number}:`), h(Text, { style: s.metaValue }, data.invoiceNumber)),
    h(View, { style: s.metaRow }, h(Text, { style: s.metaLabel }, `${t.issueDate}:`), h(Text, { style: s.metaValue }, data.issueDate)),
    data.dueDate ? h(View, { style: s.metaRow }, h(Text, { style: s.metaLabel }, `${t.dueDate}:`), h(Text, { style: s.metaValue }, data.dueDate)) : null,
  );

  const clientBox = h(View, { style: s.billedBox },
    h(Text, { style: s.sectionLabel }, t.billedTo),
    h(Text, { style: s.clientName }, data.client.legalName),
    h(Text, { style: s.clientMeta }, `${t.nif}: ${data.client.nif}`),
    h(Text, { style: s.clientMeta }, data.client.address),
    h(Text, { style: s.clientMeta }, data.client.email),
  );

  const tableHead = h(View, { style: s.tableHead },
    h(Text, { style: [s.cellDesc, s.headText] }, t.description),
    h(Text, { style: [s.cellQty, s.headText] }, t.quantity),
    h(Text, { style: [s.cellUnit, s.headText] }, t.unitPrice),
    h(Text, { style: [s.cellAmount, s.headText] }, t.lineTotal),
  );
  const rows = data.items.map((it, i) =>
    h(View, { key: String(i), style: i % 2 === 1 ? [s.row, { backgroundColor: COLORS.zebra }] : s.row },
      h(Text, { style: s.cellDesc }, it.description),
      h(Text, { style: s.cellQty }, String(it.quantity)),
      h(Text, { style: s.cellUnit }, fmt(it.unitPrice)),
      h(Text, { style: s.cellAmount }, fmt(it.quantity * it.unitPrice)),
    ),
  );

  const totalsBlock = h(View, { style: s.totals },
    h(View, { style: s.totalsRow }, h(Text, { style: s.totalsLabel }, t.subtotal), h(Text, null, fmt(data.totals.subtotal))),
    h(View, { style: s.totalsRow }, h(Text, { style: s.totalsLabel }, `${t.tax} (${data.taxRate}%)`), h(Text, null, fmt(data.totals.taxAmount))),
    h(View, { style: s.grandRow }, h(Text, { style: s.grandLabel }, t.total), h(Text, { style: s.grandValue }, fmt(data.totals.total))),
  );

  const notesBlock = data.notes
    ? h(View, { style: s.notes }, h(Text, { style: s.sectionLabel }, t.notes), h(Text, { style: s.notesText }, data.notes))
    : null;

  const doc = h(Document, { title: `${t.invoice} ${data.invoiceNumber}`, author: c.companyName },
    h(Page, { size: "A4", style: s.page },
      h(View, { style: s.header }, emitterBlock, titleBlock),
      clientBox,
      h(View, null, tableHead, ...rows),
      totalsBlock,
      notesBlock,
      h(Text, { style: s.footer, fixed: true }, `${c.companyName} · ${t.nif} ${c.nif} · ${c.email}`),
    ),
  );

  return renderToBuffer(doc);
}

/* ── Email con adjunto + BCC (reutiliza el patrón de contact.js) ────────────── */
async function sendInvoiceEmail({ to, bcc, invoiceNumber, language, companyName, pdf }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) throw new Error("Email service not configured");

  // Escape hatch SOLO para desarrollo tras un proxy/antivirus que intercepta TLS
  // ("self-signed certificate in certificate chain"). NUNCA activar en producción:
  // no pongas INVOICE_SMTP_INSECURE_TLS en los env de Vercel.
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

/* ── Validación (manual, estilo contact.js) ─────────────────────────────────── */
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  const error = validate(body);
  if (error) return res.status(400).json({ error });

  const company = getCompany();
  const language = body.language === "en" ? "en" : "es";
  const taxRate = Number.isFinite(Number(body.taxRate)) ? Number(body.taxRate) : 21;
  const items = body.items.map((it) => ({
    description: String(it.description).trim(),
    quantity: Number(it.quantity),
    unitPrice: Number(it.unitPrice),
  }));

  const invoiceNumber = getNextInvoiceNumber(new Date().getFullYear());
  const issueDate = new Date().toISOString().slice(0, 10);
  const totals = calculateTotals(items, taxRate);

  let pdf;
  try {
    pdf = await renderInvoicePdf({
      invoiceNumber,
      issueDate,
      dueDate: body.dueDate || undefined,
      language,
      company,
      client: {
        legalName: String(body.client.legalName).trim(),
        nif: String(body.client.nif).trim(),
        email: String(body.client.email).trim(),
        address: String(body.client.address).trim(),
      },
      items,
      taxRate,
      totals,
      notes: body.notes ? String(body.notes) : undefined,
      logo: Buffer.from(LOGO_JPG_BASE64, "base64"),
    });
  } catch (err) {
    console.error("Invoice PDF error:", err);
    return res.status(500).json({ error: "No se pudo generar la factura." });
  }

  try {
    await sendInvoiceEmail({
      to: String(body.client.email).trim(),
      bcc: company.bcc,
      invoiceNumber,
      language,
      companyName: company.companyName,
      pdf,
    });
  } catch (err) {
    console.error("Invoice email error:", err);
    return res.status(500).json({ error: "La factura se generó pero no se pudo enviar por email." });
  }

  // TODO(DB): persistir la factura (invoice_number, cliente, importes, status,
  // pdf_url) cuando exista la tabla `invoices` + DATABASE_URL. Ver numeración.
  console.warn(`[invoices] ${invoiceNumber} emitida SIN persistir (falta tabla clients + DATABASE_URL)`);

  return res.status(200).json({
    invoiceNumber,
    status: "sent",
    issueDate,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    total: totals.total,
    pdfBase64: pdf.toString("base64"),
  });
};
