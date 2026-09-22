/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateSpanishNif,
  validateClientTaxId,
  phoneSchema,
  isoDateSchema,
  enforceBodyLimit,
  stripControlCharacters,
  sanitizeString,
  escapeHtml,
  maskEmail,
  maskPhone,
  maskNif,
  maskName,
  contactPreSchema,
  contactPostSchema,
  normalizeContactInput,
  diagnosticoPreSchema,
  diagnosticoPostSchema,
  normalizeDiagnosticoInput,
  paymentIntentPreSchema,
  paymentIntentPostSchema,
  normalizePaymentIntentInput,
  commentPreSchema,
  commentPostSchema,
  normalizeCommentInput,
  invoiceCreatePreSchema,
  invoiceCreatePostSchema,
  normalizeInvoiceCreateInput,
} = require("../api/_validation");

// ─── Validación de NIF / NIE / CIF ──────────────────────────────────────────

test("NIF español: valida DNIs válidos con letra de control correcta", () => {
  // 12345678 % 23 = 14 -> 'Z'
  assert.equal(validateSpanishNif("12345678Z"), true);
  assert.equal(validateSpanishNif("12345678-Z"), true);
  assert.equal(validateSpanishNif(" 12345678 z "), true);
  // 00000000 % 23 = 0 -> 'T'
  assert.equal(validateSpanishNif("00000000T"), true);
});

test("NIF español: rechaza DNIs con letra incorrecta o formato inválido", () => {
  assert.equal(validateSpanishNif("12345678A"), false);
  assert.equal(validateSpanishNif("1234567Z"), false); // 7 dígitos
  assert.equal(validateSpanishNif("123456789Z"), false); // 9 dígitos
  assert.equal(validateSpanishNif(""), false);
  assert.equal(validateSpanishNif(null), false);
  assert.equal(validateSpanishNif(12345678), false);
});

test("NIF español: valida NIEs válidos (X, Y, Z)", () => {
  // X0000000 -> 0 % 23 = 0 -> 'T'
  assert.equal(validateSpanishNif("X0000000T"), true);
  // X1234567 -> 1234567 % 23 = 19 -> 'L'
  assert.equal(validateSpanishNif("X1234567L"), true);
  // Y1234567 -> 11234567 % 23 = 10 -> 'X'
  assert.equal(validateSpanishNif("Y1234567X"), true);
  // Z1234567 -> 21234567 % 23 = 1 -> 'R'
  assert.equal(validateSpanishNif("Z1234567R"), true);
  // Formato con guiones
  assert.equal(validateSpanishNif("X-1234567-L"), true);
});

test("NIF español: rechaza NIEs con letra de control incorrecta", () => {
  assert.equal(validateSpanishNif("X0000000A"), false);
  assert.equal(validateSpanishNif("W0000000T"), false);
});

test("NIF español: valida CIFs de empresas válidos", () => {
  // B12345674: sumPares = 2+4+6=12, sumImpares = (1*2)+(3*2)+(5*2->1)+(7*2->5) = 2+6+1+5=14 -> total 26 -> control 10-6=4
  assert.equal(validateSpanishNif("B12345674"), true);
  assert.equal(validateSpanishNif("B-12345674"), true);
  // A28015865 (Telefónica de España)
  assert.equal(validateSpanishNif("A28015865"), true);
});

test("NIF español: rechaza CIFs con dígito de control erróneo", () => {
  assert.equal(validateSpanishNif("B12345679"), false);
  assert.equal(validateSpanishNif("A28015860"), false);
});

// ─── Validación de Identificadores Fiscales Internacionales (VIES / Tax ID) ─

test("Tax ID internacional: valida NIF-IVA intracomunitario (VIES) y Tax IDs", () => {
  // VIES Francés, Alemán, Italiano, Neerlandés
  assert.equal(validateClientTaxId("FR12345678901", "es"), true);
  assert.equal(validateClientTaxId("DE123456789", "es"), true);
  assert.equal(validateClientTaxId("IT12345678901", "es"), true);
  assert.equal(validateClientTaxId("NL123456789B01", "es"), true);

  // Clientes internacionales con facturas en inglés
  assert.equal(validateClientTaxId("US12-3456789", "en"), true);
  assert.equal(validateClientTaxId("GB999999973", "en"), true);
  assert.equal(validateClientTaxId("123456789", "en"), true);
});

test("Tax ID internacional: rechaza identificadores malformados o inválidos en español", () => {
  // En español, si parece español pero la letra no cuadra, se rechaza
  assert.equal(validateClientTaxId("12345678A", "es"), false);
  assert.equal(validateClientTaxId("B12345679", "es"), false);
  // Strings inválidos
  assert.equal(validateClientTaxId("", "en"), false);
  assert.equal(validateClientTaxId("?", "en"), false);
});

// ─── Sanitización y Preservación de Texto Multilínea ─────────────────────────

test("Sanitización: preserva saltos de línea (\\n, \\r) y párrafos intactos", () => {
  const multiline = "Línea 1.\nLínea 2.\r\nLínea 3.";
  const clean = sanitizeString(multiline);
  assert.equal(clean, "Línea 1.\nLínea 2.\r\nLínea 3.");
  assert.ok(clean.includes("\n"), "Debe preservar el salto de línea");
  assert.ok(!clean.includes("Línea 1.Línea 2."), "No debe juntar palabras");
});

test("Sanitización: elimina caracteres de control peligrosos (NUL, DEL) sin romper texto", () => {
  const dangerous = "Hola\u0000Mundo\u0007Test\u007F!";
  assert.equal(stripControlCharacters(dangerous), "HolaMundoTest!");
});

test("Sanitización: escapeHtml escapa caracteres especiales para prevención XSS", () => {
  const input = `<script>alert("xss")</script> & 'test'`;
  const escaped = escapeHtml(input);
  assert.equal(
    escaped,
    "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;test&#39;",
  );
});

// ─── Enmascaramiento de PII para Logs Operativos y Auditoría ───────────────

test("PII Masking: enmascara emails correctamente", () => {
  assert.equal(maskEmail("carlos@gmail.com"), "c***@gmail.com");
  assert.equal(maskEmail("al@empresa.com"), "a*@empresa.com");
  assert.equal(maskEmail("a@b.com"), "*@b.com");
  assert.equal(maskEmail(""), "[REDACTED_EMAIL]");
  assert.equal(maskEmail(null), "[REDACTED_EMAIL]");
});

test("PII Masking: enmascara teléfonos correctamente", () => {
  const masked = maskPhone("+34 600 123 456");
  assert.equal(masked, "+34 ***56");
  assert.equal(maskPhone("123"), "[REDACTED_PHONE]");
  assert.equal(maskPhone(null), "[REDACTED_PHONE]");
});

test("PII Masking: enmascara NIF correctamente", () => {
  assert.equal(maskNif("12345678Z"), "123****Z");
  assert.equal(maskNif("B12345674"), "B12****4");
  assert.equal(maskNif("12"), "[REDACTED_NIF]");
});

test("PII Masking: enmascara nombres de personas y empresas correctamente", () => {
  assert.equal(maskName("Carlos Santana"), "C*** S***");
  assert.equal(maskName("Juan"), "J***");
  assert.equal(maskName(""), "[REDACTED_NAME]");
});

// ─── Validación de Teléfonos ────────────────────────────────────────────────

test("Teléfono: acepta números válidos nacionales e internacionales", () => {
  assert.equal(phoneSchema.safeParse("+34 612 34 56 78").success, true);
  assert.equal(phoneSchema.safeParse("928123456").success, true);
  assert.equal(phoneSchema.safeParse("+1 (555) 123-4567").success, true);
  assert.equal(phoneSchema.safeParse("").success, true); // Opcional
});

test("Teléfono: rechaza números con menos de 7 dígitos o caracteres prohibidos", () => {
  assert.equal(phoneSchema.safeParse("12345").success, false);
  assert.equal(phoneSchema.safeParse("teléfono: 612345678").success, false);
  assert.equal(
    phoneSchema.safeParse("+34 61234567890123456789").success,
    false,
  ); // > 20 chars
});

// ─── Validación de Fechas ISO ───────────────────────────────────────────────

test("Fecha ISO: acepta fechas de calendario válidas en formato YYYY-MM-DD", () => {
  assert.equal(isoDateSchema.safeParse("2026-09-22").success, true);
  assert.equal(isoDateSchema.safeParse("2024-02-29").success, true); // Año bisiesto
});

test("Fecha ISO: rechaza fechas inexistentes o en formatos no ISO", () => {
  assert.equal(isoDateSchema.safeParse("2026-02-30").success, false); // Febrero no tiene día 30
  assert.equal(isoDateSchema.safeParse("2026-13-01").success, false); // Mes 13
  assert.equal(isoDateSchema.safeParse("22/09/2026").success, false); // Formato ES no ISO
  assert.equal(isoDateSchema.safeParse("fecha-invalida").success, false);
});

// ─── Límite de Tamaño de Body ───────────────────────────────────────────────

test("Límite de body: rechaza peticiones que exceden maxBytes por header content-length", () => {
  let statusCode = 0;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(data) {
          responseData = data;
        },
      };
    },
  };
  const req = {
    headers: { "content-length": "200000" }, // 200 KB
  };

  const allowed = enforceBodyLimit(req, res, 100 * 1024); // Límite 100 KB
  assert.equal(allowed, false);
  assert.equal(statusCode, 413);
  assert.match(responseData.error, /Payload Too Large/);
});

test("Límite de body: rechaza peticiones cuyo body supera el límite en memoria", () => {
  let statusCode = 0;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return {
        json(data) {
          responseData = data;
        },
      };
    },
  };
  const massiveData = "x".repeat(150 * 1024);
  const req = {
    headers: {},
    body: { data: massiveData },
  };

  const allowed = enforceBodyLimit(req, res, 100 * 1024);
  assert.equal(allowed, false);
  assert.equal(statusCode, 413);
  assert.match(responseData.error, /Payload Too Large/);
});

test("Límite de body: permite peticiones dentro del límite permitido", () => {
  const res = { status: () => ({ json: () => {} }) };
  const req = {
    headers: { "content-length": "500" },
    body: { name: "Test" },
  };

  assert.equal(enforceBodyLimit(req, res, 100 * 1024), true);
});

// ─── Endpoint Contacto (/api/contact) ────────────────────────────────────────

test("Contacto: valida y normaliza payload válido preservando saltos de línea", () => {
  const raw = {
    name: "  Carlos Santana  ",
    email: " CARLOS@GMAIL.COM ",
    company: "<b>Mi Empresa</b>",
    message:
      "Hola,\n\nMe gustaría solicitar un presupuesto detallado.\nGracias.",
  };

  const pre = contactPreSchema.safeParse(raw);
  assert.equal(pre.success, true);

  const normalized = normalizeContactInput(pre.data);
  assert.equal(normalized.email, "carlos@gmail.com");
  assert.equal(normalized.company, "Mi Empresa"); // Tags HTML saneados por XSS
  assert.ok(
    normalized.message.includes("\n"),
    "Debe preservar saltos de línea",
  );

  const post = contactPostSchema.safeParse(normalized);
  assert.equal(post.success, true);
});

test("Contacto: rechaza emails mal formados que antes pasaban con includes('@')", () => {
  const badEmails = ["usuario@", "test@sin-punto", "algo@.com", "@dominio.com"];
  for (const email of badEmails) {
    const post = contactPostSchema.safeParse({
      name: "Juan Perez",
      email,
      message: "Mensaje de prueba con más de 10 caracteres.",
    });
    assert.equal(post.success, false, `Debió rechazar ${email}`);
  }
});

test("Contacto: rechaza textos que superan límites o quedan vacíos", () => {
  const pre = contactPreSchema.safeParse({
    name: "A", // Demasiado corto
    email: "valido@correo.com",
    message: "Corto", // Menor a 10
  });
  assert.equal(pre.success, false);
});

// ─── Endpoint Pagos (/api/create-payment-intent) ─────────────────────────────

test("Pagos: valida importes finitos y dentro de rango permitido", () => {
  const raw = {
    name: "Cliente Empresa",
    email: "cliente@empresa.com",
    amount: 150.5,
  };

  const pre = paymentIntentPreSchema.safeParse(raw);
  assert.equal(pre.success, true);

  const normalized = normalizePaymentIntentInput(pre.data);
  const post = paymentIntentPostSchema.safeParse(normalized);
  assert.equal(post.success, true);
  assert.equal(post.data.amount, 150.5);
});

test("Pagos: rechaza importes negativos, cero, infinitos o fuera de rango", () => {
  const badAmounts = [-10, 0, 0.5, 50001, NaN, Infinity, -Infinity];
  for (const amount of badAmounts) {
    const normalized = normalizePaymentIntentInput({
      name: "Cliente",
      email: "cliente@empresa.com",
      amount,
    });
    const post = paymentIntentPostSchema.safeParse(normalized);
    assert.equal(post.success, false, `Debió rechazar importe ${amount}`);
  }
});

// ─── Endpoint Comentarios (/api/comments) ───────────────────────────────────

test("Comentarios: valida postId entero positivo, autor y contenido multilínea", () => {
  const raw = {
    postId: 1,
    authorName: "  Ana Garcia  ",
    authorEmail: "ana@ejemplo.com",
    content:
      "Excelente artículo sobre optimización tecnológica.\n\nTotalmente de acuerdo.",
  };

  const pre = commentPreSchema.safeParse(raw);
  assert.equal(pre.success, true);

  const normalized = normalizeCommentInput(pre.data);
  const post = commentPostSchema.safeParse(normalized);
  assert.equal(post.success, true);
  assert.equal(post.data.authorName, "Ana Garcia");
  assert.ok(post.data.content.includes("\n"), "Debe preservar saltos de línea");
});

test("Comentarios: rechaza postId no entero, comentarios demasiado largos o email inválido", () => {
  assert.equal(
    commentPreSchema.safeParse({
      postId: 1.5, // No es entero
      authorName: "Ana",
      authorEmail: "ana@ejemplo.com",
      content: "Buen post",
    }).success,
    false,
  );

  assert.equal(
    commentPostSchema.safeParse({
      postId: 1,
      authorName: "Ana",
      authorEmail: "invalido",
      content: "Buen post",
    }).success,
    false,
  );

  assert.equal(
    commentPreSchema.safeParse({
      postId: 1,
      authorName: "Ana",
      authorEmail: "ana@ejemplo.com",
      content: "x".repeat(2001), // Supera 2000 chars
    }).success,
    false,
  );
});

// ─── Endpoint Facturación (/api/invoices/create) ─────────────────────────────

test("Facturación: valida factura completa con NIF válido, taxRate positivo y fecha ISO", () => {
  const raw = {
    client: {
      legalName: "Empresa Canaria SL",
      nif: "B-12345674",
      email: "facturacion@canaria.com",
      address: "Calle Mayor 1, Las Palmas",
    },
    items: [
      {
        description: "Consultoría de Software",
        quantity: 10,
        unitPrice: 85,
      },
    ],
    taxRate: 7, // IGIC
    language: "es",
    dueDate: "2026-10-31",
  };

  const pre = invoiceCreatePreSchema.safeParse(raw);
  assert.equal(pre.success, true);

  const normalized = normalizeInvoiceCreateInput(pre.data);
  assert.equal(normalized.client.nif, "B12345674");

  const post = invoiceCreatePostSchema.safeParse(normalized);
  assert.equal(post.success, true);
  assert.equal(post.data.taxRate, 7);
  assert.equal(post.data.dueDate, "2026-10-31");
});

test("Facturación: permite facturas internacionales en inglés con NIF-IVA de la UE (VIES) o Tax ID", () => {
  const internationalPayload = {
    client: {
      legalName: "Acme Corp International",
      nif: "FR12345678901", // NIF-IVA Francés VIES
      email: "billing@acmecorp.fr",
      address: "10 Rue de la Paix, Paris",
    },
    items: [{ description: "Cloud Consulting", quantity: 5, unitPrice: 200 }],
    taxRate: 0,
    language: "en",
    dueDate: "2026-11-15",
  };

  const pre = invoiceCreatePreSchema.safeParse(internationalPayload);
  assert.equal(pre.success, true);

  const normalized = normalizeInvoiceCreateInput(pre.data);
  const post = invoiceCreatePostSchema.safeParse(normalized);
  assert.equal(post.success, true);
  assert.equal(post.data.client.nif, "FR12345678901");
});

test("Facturación: permite facturas en inglés con Tax ID estadounidense", () => {
  const usPayload = {
    client: {
      legalName: "Tech Global Inc",
      nif: "12-3456789", // US EIN
      email: "accounts@techglobal.us",
      address: "123 Market St, San Francisco, CA",
    },
    items: [
      { description: "AI Integration Services", quantity: 1, unitPrice: 3500 },
    ],
    taxRate: 0,
    language: "en",
  };

  const pre = invoiceCreatePreSchema.safeParse(usPayload);
  assert.equal(pre.success, true);

  const normalized = normalizeInvoiceCreateInput(pre.data);
  const post = invoiceCreatePostSchema.safeParse(normalized);
  assert.equal(post.success, true);
});

test("Facturación: rechaza taxRate negativo o superior a 100", () => {
  const makePayload = (taxRate) => ({
    client: {
      legalName: "Empresa",
      nif: "12345678Z",
      email: "test@empresa.com",
      address: "Calle 1",
    },
    items: [{ description: "Servicio", quantity: 1, unitPrice: 100 }],
    taxRate,
    language: "es",
  });

  const normalizedNeg = normalizeInvoiceCreateInput(makePayload(-5));
  assert.equal(invoiceCreatePostSchema.safeParse(normalizedNeg).success, false);

  const normalizedOver = normalizeInvoiceCreateInput(makePayload(105));
  assert.equal(
    invoiceCreatePostSchema.safeParse(normalizedOver).success,
    false,
  );
});

test("Facturación: rechaza NIF inválido en español cuando no es un DNI/NIE/CIF ni VIES válido", () => {
  const raw = {
    client: {
      legalName: "Empresa",
      nif: "12345678A", // Letra incorrecta
      email: "test@empresa.com",
      address: "Calle 1",
    },
    items: [{ description: "Servicio", quantity: 1, unitPrice: 100 }],
    taxRate: 21,
    language: "es",
  };

  const normalized = normalizeInvoiceCreateInput(raw);
  const post = invoiceCreatePostSchema.safeParse(normalized);
  assert.equal(post.success, false);
});

test("Facturación: rechaza líneas con cantidad menor o igual a 0 o precio negativo", () => {
  const raw = {
    client: {
      legalName: "Empresa",
      nif: "12345678Z",
      email: "test@empresa.com",
      address: "Calle 1",
    },
    items: [{ description: "Servicio", quantity: 0, unitPrice: -50 }],
  };

  const normalized = normalizeInvoiceCreateInput(raw);
  const post = invoiceCreatePostSchema.safeParse(normalized);
  assert.equal(post.success, false);
});

// ─── Endpoint Diagnóstico (/api/diagnostico) ─────────────────────────────────

test("Diagnóstico: valida payload de diagnóstico con pre y post validación", () => {
  const raw = {
    company_name: "Tech Solutions SL",
    sector: "Tecnología",
    size: "10-49 empleados",
    email: "contacto@techsolutions.es",
    marked_problems: [1, 2, 3],
    free_text:
      "Primer párrafo del problema.\n\nSegundo párrafo con detalles adicionales.",
    contact_preference: "email",
    phone: "+34 600 123 456",
  };

  const pre = diagnosticoPreSchema.safeParse(raw);
  assert.equal(pre.success, true);

  const normalized = normalizeDiagnosticoInput(pre.data);
  const post = diagnosticoPostSchema.safeParse(normalized);
  assert.equal(post.success, true);
  assert.equal(post.data.phone, "+34 600 123 456");
  assert.ok(
    post.data.free_text.includes("\n"),
    "Debe preservar saltos de línea",
  );
});

test("Diagnóstico: rechaza más de 20 problemas marcados o problemas inexistentes", () => {
  const raw = {
    company_name: "Tech Solutions SL",
    sector: "Tecnología",
    size: "10-49 empleados",
    email: "contacto@techsolutions.es",
    marked_problems: [9999], // Inexistente
    free_text: "Descripción detallada del problema con suficiente texto",
    contact_preference: "email",
  };

  const normalized = normalizeDiagnosticoInput(raw);
  const post = diagnosticoPostSchema.safeParse(normalized);
  assert.equal(post.success, false);
});

test("Diagnóstico: exige texto libre si se seleccionan menos de 3 problemas", () => {
  const raw = {
    company_name: "Tech Solutions SL",
    sector: "Tecnología",
    size: "10-49 empleados",
    email: "contacto@techsolutions.es",
    marked_problems: [1],
    free_text: "   ", // Vacío
    contact_preference: "email",
  };

  const normalized = normalizeDiagnosticoInput(raw);
  const post = diagnosticoPostSchema.safeParse(normalized);
  assert.equal(post.success, false);
});
