// Módulo compartido de facturación: datos fiscales, totales, i18n y render del PDF.
// Lo usan tanto la emisión (api/invoices/create.js) como la regeneración bajo
// demanda (api/admin-invoices.js). El PDF NO se guarda: se regenera desde los datos.

const React = require("react");
const { LOGO_JPG_BASE64 } = require("./vertex-logo.js");

/* ── Datos fiscales del emisor (configurables por env, NO quemados) ─────────── */
function getCompany() {
  const env = process.env;
  return {
    companyName:
      env.INVOICE_COMPANY_NAME || "Vertex Tech Digital — en constitución",
    nif: env.INVOICE_NIF || "[NIF pendiente de alta]",
    address: env.INVOICE_ADDRESS || "[Domicilio fiscal pendiente]",
    iae: env.INVOICE_IAE || "[IAE pendiente de alta]",
    email:
      env.INVOICE_EMAIL ||
      env.EMAIL_INTERNAL_NOTIFICATION ||
      "[Correo de Contacto]",
    bcc:
      env.INVOICE_BCC ||
      env.EMAIL_INTERNAL_NOTIFICATION ||
      "[Correo de Contacto]",
  };
}

/* ── Totales ────────────────────────────────────────────────────────────────── */
function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
function calculateTotals(items, taxRate) {
  const subtotal = round2(
    items.reduce((a, it) => a + it.quantity * it.unitPrice, 0),
  );
  const taxAmount = round2(subtotal * (taxRate / 100));
  return { subtotal, taxAmount, total: round2(subtotal + taxAmount) };
}

/* ── i18n ES/EN ─────────────────────────────────────────────────────────────── */
const LABELS = {
  es: {
    invoice: "FACTURA",
    number: "Nº de factura",
    issueDate: "Fecha de emisión",
    dueDate: "Fecha de vencimiento",
    billedTo: "Facturar a",
    nif: "NIF/CIF",
    description: "Descripción",
    quantity: "Cant.",
    unitPrice: "Precio unit.",
    lineTotal: "Importe",
    subtotal: "Base imponible",
    tax: "IGIC",
    total: "Total",
    notes: "Notas",
    iae: "Epígrafe IAE",
    locale: "es-ES",
  },
  en: {
    invoice: "INVOICE",
    number: "Invoice no.",
    issueDate: "Issue date",
    dueDate: "Due date",
    billedTo: "Billed to",
    nif: "Tax ID",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit price",
    lineTotal: "Amount",
    subtotal: "Subtotal",
    tax: "IGIC",
    total: "Total",
    notes: "Notes",
    iae: "Business activity code",
    locale: "en-GB",
  },
};
function money(value, locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

// Convierte una fecha ISO "aaaa-mm-dd" al formato español dd/mm/aaaa (usado en el PDF).
function toEsDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/* ── Render del PDF con react-pdf (import dinámico: es ESM) ──────────────────── */
async function renderInvoicePdf(data) {
  const { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } =
    await import("@react-pdf/renderer");
  const h = React.createElement;
  const t = LABELS[data.language] || LABELS.es;
  const c = data.company;
  const fmt = (v) => money(v, t.locale);
  const logo = Buffer.from(LOGO_JPG_BASE64, "base64");

  const COLORS = {
    ink: "#0d1117",
    muted: "#6b7280",
    border: "#e5e7eb",
    accent: "#2563eb",
    zebra: "#f9fafb",
  };
  const s = StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 56,
      paddingHorizontal: 44,
      fontSize: 10,
      color: COLORS.ink,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 28,
    },
    logo: { width: 80, height: 80, objectFit: "contain", marginBottom: 8 },
    companyName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
    companyMeta: { color: COLORS.muted, marginTop: 3, maxWidth: 240 },
    invoiceTitle: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      color: COLORS.accent,
      textAlign: "right",
    },
    metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
    metaLabel: { color: COLORS.muted, textAlign: "right" },
    metaValue: {
      fontFamily: "Helvetica-Bold",
      marginLeft: 8,
      textAlign: "right",
    },
    billedBox: {
      marginBottom: 22,
      padding: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 4,
    },
    sectionLabel: {
      fontSize: 8,
      color: COLORS.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    clientName: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    clientMeta: { color: COLORS.muted, marginTop: 2 },
    tableHead: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: COLORS.ink,
      paddingBottom: 6,
      marginBottom: 2,
    },
    row: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    cellDesc: { flex: 5 },
    cellQty: { flex: 1, textAlign: "right" },
    cellUnit: { flex: 2, textAlign: "right" },
    cellAmount: { flex: 2, textAlign: "right" },
    headText: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase" },
    totals: { marginTop: 16, alignSelf: "flex-end", width: 240 },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    totalsLabel: { color: COLORS.muted },
    grandRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: COLORS.ink,
    },
    grandLabel: { fontFamily: "Helvetica-Bold", fontSize: 12 },
    grandValue: {
      fontFamily: "Helvetica-Bold",
      fontSize: 12,
      color: COLORS.accent,
    },
    notes: { marginTop: 26 },
    notesText: { color: COLORS.muted, lineHeight: 1.5 },
    footer: {
      position: "absolute",
      bottom: 28,
      left: 44,
      right: 44,
      textAlign: "center",
      color: COLORS.muted,
      fontSize: 8,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingTop: 8,
    },
  });

  const emitterBlock = h(
    View,
    null,
    h(Image, { style: s.logo, src: { data: logo, format: "jpg" } }),
    h(Text, { style: s.companyName }, c.companyName),
    h(Text, { style: s.companyMeta }, `${t.nif}: ${c.nif}`),
    h(Text, { style: s.companyMeta }, c.address),
    h(Text, { style: s.companyMeta }, c.email),
    h(Text, { style: s.companyMeta }, `${t.iae}: ${c.iae}`),
  );

  const titleBlock = h(
    View,
    null,
    h(Text, { style: s.invoiceTitle }, t.invoice),
    h(
      View,
      { style: s.metaRow },
      h(Text, { style: s.metaLabel }, `${t.number}:`),
      h(Text, { style: s.metaValue }, data.invoiceNumber),
    ),
    h(
      View,
      { style: s.metaRow },
      h(Text, { style: s.metaLabel }, `${t.issueDate}:`),
      h(Text, { style: s.metaValue }, data.issueDate),
    ),
    data.dueDate
      ? h(
          View,
          { style: s.metaRow },
          h(Text, { style: s.metaLabel }, `${t.dueDate}:`),
          h(Text, { style: s.metaValue }, data.dueDate),
        )
      : null,
  );

  const clientBox = h(
    View,
    { style: s.billedBox },
    h(Text, { style: s.sectionLabel }, t.billedTo),
    h(Text, { style: s.clientName }, data.client.legalName),
    h(Text, { style: s.clientMeta }, `${t.nif}: ${data.client.nif}`),
    h(Text, { style: s.clientMeta }, data.client.address),
    h(Text, { style: s.clientMeta }, data.client.email),
  );

  const tableHead = h(
    View,
    { style: s.tableHead },
    h(Text, { style: [s.cellDesc, s.headText] }, t.description),
    h(Text, { style: [s.cellQty, s.headText] }, t.quantity),
    h(Text, { style: [s.cellUnit, s.headText] }, t.unitPrice),
    h(Text, { style: [s.cellAmount, s.headText] }, t.lineTotal),
  );
  const rows = data.items.map((it, i) =>
    h(
      View,
      {
        key: String(i),
        style: i % 2 === 1 ? [s.row, { backgroundColor: COLORS.zebra }] : s.row,
      },
      h(Text, { style: s.cellDesc }, it.description),
      h(Text, { style: s.cellQty }, String(it.quantity)),
      h(Text, { style: s.cellUnit }, fmt(it.unitPrice)),
      h(Text, { style: s.cellAmount }, fmt(it.quantity * it.unitPrice)),
    ),
  );

  const totalsBlock = h(
    View,
    { style: s.totals },
    h(
      View,
      { style: s.totalsRow },
      h(Text, { style: s.totalsLabel }, t.subtotal),
      h(Text, null, fmt(data.totals.subtotal)),
    ),
    h(
      View,
      { style: s.totalsRow },
      h(Text, { style: s.totalsLabel }, `${t.tax} (${data.taxRate}%)`),
      h(Text, null, fmt(data.totals.taxAmount)),
    ),
    h(
      View,
      { style: s.grandRow },
      h(Text, { style: s.grandLabel }, t.total),
      h(Text, { style: s.grandValue }, fmt(data.totals.total)),
    ),
  );

  const notesBlock = data.notes
    ? h(
        View,
        { style: s.notes },
        h(Text, { style: s.sectionLabel }, t.notes),
        h(Text, { style: s.notesText }, data.notes),
      )
    : null;

  const doc = h(
    Document,
    { title: `${t.invoice} ${data.invoiceNumber}`, author: c.companyName },
    h(
      Page,
      { size: "A4", style: s.page },
      h(View, { style: s.header }, emitterBlock, titleBlock),
      clientBox,
      h(View, null, tableHead, ...rows),
      totalsBlock,
      notesBlock,
      h(
        Text,
        { style: s.footer, fixed: true },
        `${c.companyName} · ${t.nif} ${c.nif} · ${c.email}`,
      ),
    ),
  );

  return renderToBuffer(doc);
}

module.exports = { getCompany, calculateTotals, renderInvoicePdf, toEsDate };
