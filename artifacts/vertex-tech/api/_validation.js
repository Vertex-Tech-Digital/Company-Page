const { z } = require("zod");
const xss = require("xss");
const { problemsData } = require("../src/data/problemsData");
const {
  validateInputRequirements,
} = require("../src/utils/diagnosisValidation");

// ─── Límite de Tamaño de Body ────────────────────────────────────────────────
const DEFAULT_MAX_BODY_BYTES = 100 * 1024; // 100 KB
const INVOICE_MAX_BODY_BYTES = 500 * 1024; // 500 KB

function enforceBodyLimit(req, res, maxBytes = DEFAULT_MAX_BODY_BYTES) {
  const rawContentLength = req.headers
    ? req.headers["content-length"]
    : undefined;
  const contentLength =
    rawContentLength !== undefined ? parseInt(rawContentLength, 10) : NaN;

  if (!isNaN(contentLength) && contentLength > maxBytes) {
    res.status(413).json({
      error:
        "Payload Too Large: el tamaño de la petición excede el límite permitido.",
    });
    return false;
  }

  if (req.body !== undefined && req.body !== null) {
    try {
      const bodyStr =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const byteLength = Buffer.byteLength(bodyStr, "utf8");
      if (byteLength > maxBytes) {
        res.status(413).json({
          error:
            "Payload Too Large: el tamaño de la petición excede el límite permitido.",
        });
        return false;
      }
    } catch {
      // Si falla serializar, continuamos a la validación de esquema
    }
  }

  return true;
}

// ─── Sanitización y Escape XSS ───────────────────────────────────────────────
const xssFilter = new xss.FilterXSS({
  whiteList: {}, // Ningún tag HTML permitido
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "xml", "iframe", "object"],
});

/**
 * Elimina caracteres de control ASCII sin usar regex (evita no-control-regex de ESLint).
 * Preserva intencionadamente \t (9), \n (10) y \r (13) para no corromper textos multilínea.
 */
function stripControlCharacters(str) {
  if (typeof str !== "string") return "";
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Preservar tabulaciones (\t=9), saltos de línea (\n=10) y retornos de carro (\r=13)
    if (code === 9 || code === 10 || code === 13) {
      result += str[i];
    } else if ((code >= 0 && code <= 31) || code === 127) {
      // Omitir caracteres de control peligrosos o no imprimibles
      continue;
    } else {
      result += str[i];
    }
  }
  return result;
}

function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return stripControlCharacters(xssFilter.process(str)).trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

// ─── Algoritmo Oficial de Validación NIF / NIE / CIF Español ───────────────────
const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_CONTROL_LETTERS = "JABCDEFGHI";

function validateSpanishNif(value) {
  if (typeof value !== "string") return false;
  const nif = value.replace(/[\s-]/g, "").toUpperCase();

  // 1. DNI: 8 dígitos + letra
  const dniMatch = /^(\d{8})([A-Z])$/.exec(nif);
  if (dniMatch) {
    const num = parseInt(dniMatch[1], 10);
    const letter = dniMatch[2];
    return DNI_LETTERS[num % 23] === letter;
  }

  // 2. NIE: X/Y/Z + 7 dígitos + letra
  const nieMatch = /^([XYZ])(\d{7})([A-Z])$/.exec(nif);
  if (nieMatch) {
    const prefixMap = { X: 0, Y: 1, Z: 2 };
    const num = parseInt(`${prefixMap[nieMatch[1]]}${nieMatch[2]}`, 10);
    const letter = nieMatch[3];
    return DNI_LETTERS[num % 23] === letter;
  }

  // 3. CIF: 1 letra (A-W excepto I, O) + 7 dígitos + carácter de control (letra o dígito)
  const cifMatch = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(nif);
  if (cifMatch) {
    const letter = cifMatch[1];
    const digits = cifMatch[2];
    const controlChar = cifMatch[3];

    let sumPares = 0;
    let sumImpares = 0;

    for (let i = 0; i < 7; i++) {
      const digit = parseInt(digits[i], 10);
      if (i % 2 === 1) {
        // Posiciones 2, 4, 6 (índices 1, 3, 5)
        sumPares += digit;
      } else {
        // Posiciones 1, 3, 5, 7 (índices 0, 2, 4, 6)
        const mult = digit * 2;
        sumImpares += Math.floor(mult / 10) + (mult % 10);
      }
    }

    const sumaTotal = sumPares + sumImpares;
    const unidad = sumaTotal % 10;
    const digitoControl = unidad === 0 ? 0 : 10 - unidad;
    const letraControl = CIF_CONTROL_LETTERS[digitoControl];

    // Reglas según tipo de entidad:
    // Solo número de control: A, B, E, H
    // Solo letra de control: K, P, Q, S
    // Cualquiera de los dos: C, D, F, G, J, N, R, U, V, W
    const soloNumero = "ABEH".includes(letter);
    const soloLetra = "KPQS".includes(letter);

    if (soloNumero) {
      return controlChar === String(digitoControl);
    }
    if (soloLetra) {
      return controlChar === letraControl;
    }
    return (
      controlChar === String(digitoControl) || controlChar === letraControl
    );
  }

  return false;
}

// ─── Validación de Identificador Fiscal de Cliente (Nacional e Internacional) ──
const EU_VAT_REGEX =
  /^(AT|BE|BG|CY|CZ|DE|DK|EE|EL|ES|FI|FR|HR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK|GB)[0-9A-Z]{2,13}$/i;
const INTL_TAX_ID_REGEX = /^[A-Z0-9-]{2,30}$/i;

function validateClientTaxId(rawNif, language = "es") {
  if (typeof rawNif !== "string") return false;
  const nif = rawNif.replace(/[\s-]/g, "").toUpperCase();
  if (nif.length < 2 || nif.length > 30) return false;

  // 1. Si es DNI/NIE/CIF español válido, es aceptado siempre
  if (validateSpanishNif(nif)) {
    return true;
  }

  // 2. NIF-IVA intracomunitario (VIES) de la Unión Europea o Reino Unido
  if (EU_VAT_REGEX.test(nif)) {
    return true;
  }

  // 3. Facturas en inglés / clientes internacionales: identificador fiscal válido
  if (language === "en" && INTL_TAX_ID_REGEX.test(nif)) {
    return true;
  }

  return false;
}

// ─── Validadores de Dominio Reutilizables ─────────────────────────────────────
const spanishNifSchema = z
  .string()
  .min(1, "NIF/CIF requerido")
  .max(20, "NIF/CIF demasiado largo")
  .refine(validateSpanishNif, {
    message: "El NIF/CIF/NIE introducido no es válido",
  });

const phoneRegex = /^(\+?[0-9\s().-]{7,20})$/;
const phoneSchema = z
  .string()
  .max(20, "El teléfono no puede superar los 20 caracteres")
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      const digitsCount = (val.match(/\d/g) || []).length;
      return digitsCount >= 7 && phoneRegex.test(val.trim());
    },
    { message: "Número de teléfono inválido (mínimo 7 dígitos)" },
  );

const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe estar en formato ISO (YYYY-MM-DD)",
  )
  .refine(
    (val) => {
      const [y, m, d] = val.split("-").map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() === m - 1 &&
        date.getUTCDate() === d
      );
    },
    { message: "Fecha calendario inválida" },
  );

// ─── Formateador de Errores Zod ──────────────────────────────────────────────
function formatZodError(error) {
  if (!error || !error.issues || error.issues.length === 0) {
    return "Datos de entrada inválidos.";
  }
  const first = error.issues[0];
  const path = first.path.join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

// ─── 1. Esquemas para CONTACTO (/api/contact) ─────────────────────────────────
const contactPreSchema = z.object({
  name: z.string({ required_error: "El nombre es requerido" }).min(2).max(100),
  email: z.string({ required_error: "El email es requerido" }).min(5).max(255),
  company: z.string().max(100).optional().nullable(),
  message: z
    .string({ required_error: "El mensaje es requerido" })
    .min(10)
    .max(5000),
});

const contactPostSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  email: z.string().email("Email inválido").max(255),
  company: z.string().max(100).optional().nullable(),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(5000),
});

function normalizeContactInput(raw) {
  return {
    name: sanitizeString(raw.name),
    email: sanitizeString(raw.email).toLowerCase(),
    company: raw.company ? sanitizeString(raw.company) : undefined,
    message: sanitizeString(raw.message),
  };
}

// ─── 2. Esquemas para DIAGNÓSTICO (/api/diagnostico) ──────────────────────────
const VALID_SIZES = [
  "1-9 empleados",
  "10-49 empleados",
  "50-249 empleados",
  "250+ empleados",
];

const VALID_CONTACT_PREFERENCES = ["cafe", "llamada", "email"];

const diagnosticoPreSchema = z.object({
  company_name: z
    .string({ required_error: "Razón social requerida" })
    .min(2)
    .max(100),
  sector: z.string({ required_error: "Sector requerido" }).min(2).max(50),
  size: z.enum(VALID_SIZES, {
    errorMap: () => ({ message: "Tamaño de empresa inválido" }),
  }),
  email: z.string({ required_error: "Email requerido" }).min(5).max(255),
  marked_problems: z
    .array(z.number().int().positive())
    .max(20, "No se pueden seleccionar más de 20 problemas"),
  free_text: z.string({ required_error: "Texto libre requerido" }).max(5000),
  contact_preference: z.enum(VALID_CONTACT_PREFERENCES, {
    errorMap: () => ({ message: "Preferencia de contacto inválida" }),
  }),
  phone: z.string().max(20).optional().nullable(),
});

const diagnosticoPostSchema = z
  .object({
    company_name: z.string().min(2, "Nombre de empresa inválido").max(100),
    sector: z.string().min(2, "Sector inválido").max(50),
    size: z.enum(VALID_SIZES),
    email: z.string().email("Email inválido").max(255),
    marked_problems: z
      .array(z.number().int().positive())
      .max(20)
      .refine(
        (problems) =>
          problems.every((id) => problemsData.some((p) => p.id === id)),
        {
          message:
            "Uno o más problemas seleccionados no existen en el catálogo",
        },
      ),
    free_text: z.string().max(5000),
    contact_preference: z.enum(VALID_CONTACT_PREFERENCES),
    phone: phoneSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const inputError = validateInputRequirements(
      data.marked_problems,
      data.free_text,
    );
    if (inputError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: inputError,
        path: ["free_text"],
      });
    }
  });

function normalizeDiagnosticoInput(raw) {
  return {
    company_name: sanitizeString(raw.company_name),
    sector: sanitizeString(raw.sector),
    size: sanitizeString(raw.size),
    email: sanitizeString(raw.email).toLowerCase(),
    marked_problems: Array.isArray(raw.marked_problems)
      ? raw.marked_problems
      : [],
    free_text: sanitizeString(raw.free_text),
    contact_preference: sanitizeString(raw.contact_preference),
    phone: raw.phone ? sanitizeString(raw.phone) : "",
  };
}

// ─── 3. Esquemas para PAGOS (/api/create-payment-intent) ─────────────────────
const MIN_PAYMENT_EUROS = 1; // 1,00 €
const MAX_PAYMENT_EUROS = 50000; // 50.000,00 €

const paymentIntentPreSchema = z.object({
  name: z.string({ required_error: "Nombre requerido" }).min(2).max(100),
  email: z.string({ required_error: "Email requerido" }).min(5).max(255),
  amount: z.union([z.number(), z.string()], {
    required_error: "Importe requerido",
  }),
});

const paymentIntentPostSchema = z.object({
  name: z.string().min(2, "Nombre inválido").max(100),
  email: z.string().email("Email inválido").max(255),
  amount: z
    .number()
    .finite("El importe debe ser un número finito")
    .min(MIN_PAYMENT_EUROS, `El importe mínimo es ${MIN_PAYMENT_EUROS} €`)
    .max(MAX_PAYMENT_EUROS, `El importe máximo es ${MAX_PAYMENT_EUROS} €`),
});

function normalizePaymentIntentInput(raw) {
  return {
    name: sanitizeString(raw.name),
    email: sanitizeString(raw.email).toLowerCase(),
    amount: typeof raw.amount === "number" ? raw.amount : Number(raw.amount),
  };
}

// ─── 4. Esquemas para COMENTARIOS (/api/comments) ─────────────────────────────
const commentPreSchema = z.object({
  postId: z.number({ required_error: "postId requerido" }).int().positive(),
  authorName: z.string({ required_error: "Nombre requerido" }).min(2).max(100),
  authorEmail: z.string({ required_error: "Email requerido" }).min(5).max(255),
  content: z
    .string({ required_error: "Comentario requerido" })
    .min(5)
    .max(2000),
});

const commentPostSchema = z.object({
  postId: z.number().int().positive("postId debe ser un entero positivo"),
  authorName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100),
  authorEmail: z.string().email("El email no es válido").max(255),
  content: z
    .string()
    .min(5, "El comentario es requerido (mínimo 5 caracteres)")
    .max(2000, "El comentario no puede superar los 2000 caracteres"),
});

function normalizeCommentInput(raw) {
  return {
    postId: Number(raw.postId),
    authorName: sanitizeString(raw.authorName),
    authorEmail: sanitizeString(raw.authorEmail).toLowerCase(),
    content: sanitizeString(raw.content),
  };
}

// ─── 5. Esquemas para FACTURACIÓN (/api/invoices/create) ──────────────────────
const invoiceItemPreSchema = z.object({
  description: z
    .string({ required_error: "Descripción requerida" })
    .min(1)
    .max(300),
  quantity: z.union([z.number(), z.string()], {
    required_error: "Cantidad requerida",
  }),
  unitPrice: z.union([z.number(), z.string()], {
    required_error: "Precio unitario requerido",
  }),
});

const invoiceItemPostSchema = z.object({
  description: z.string().min(1, "Cada línea necesita descripción").max(300),
  quantity: z
    .number()
    .finite("La cantidad debe ser finita")
    .positive("Las cantidades deben ser mayores que 0")
    .max(1000000, "Cantidad fuera de rango"),
  unitPrice: z
    .number()
    .finite("El precio unitario debe ser finito")
    .min(0, "Precios unitarios inválidos (no pueden ser negativos)")
    .max(10000000, "Precio unitario fuera de rango"),
});

const invoiceCreatePreSchema = z.object({
  client: z.object(
    {
      legalName: z
        .string({ required_error: "Razón social requerida" })
        .min(2)
        .max(150),
      nif: z.string({ required_error: "NIF/Tax ID requerido" }).min(1).max(30),
      email: z.string({ required_error: "Email requerido" }).min(5).max(255),
      address: z
        .string({ required_error: "Dirección requerida" })
        .min(1)
        .max(300),
    },
    { required_error: "Faltan los datos del cliente." },
  ),
  items: z
    .array(invoiceItemPreSchema, {
      required_error: "La factura necesita al menos una línea.",
    })
    .min(1, "La factura necesita al menos una línea.")
    .max(100, "La factura no puede superar 100 líneas."),
  taxRate: z.union([z.number(), z.string()]).optional(),
  language: z.enum(["es", "en"]).optional(),
  dueDate: z.string().max(30).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const invoiceCreatePostSchema = z
  .object({
    client: z.object({
      legalName: z
        .string()
        .min(2, "Razón social inválida (mínimo 2 caracteres)")
        .max(150),
      nif: z
        .string()
        .min(2, "NIF/Tax ID inválido")
        .max(30, "NIF/Tax ID demasiado largo"),
      email: z.string().email("Email de facturación inválido").max(255),
      address: z.string().min(1, "Dirección inválida").max(300),
    }),
    items: z
      .array(invoiceItemPostSchema)
      .min(1, "La factura necesita al menos una línea.")
      .max(100),
    taxRate: z
      .number()
      .finite("El tipo impositivo debe ser finito")
      .min(0, "El tipo impositivo (taxRate) no puede ser negativo")
      .max(100, "El tipo impositivo (taxRate) no puede superar el 100%"),
    language: z.enum(["es", "en"]),
    dueDate: isoDateSchema.optional().nullable(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (!validateClientTaxId(data.client.nif, data.language)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.language === "en"
            ? "Invalid Tax ID / VAT number"
            : "El NIF/CIF español o NIF-IVA intracomunitario no es válido",
        path: ["client", "nif"],
      });
    }
  });

function normalizeInvoiceCreateInput(raw) {
  const rawClient = raw.client || {};
  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  const client = {
    legalName: sanitizeString(rawClient.legalName),
    nif: String(rawClient.nif ?? "")
      .replace(/[\s-]/g, "")
      .toUpperCase(),
    email: sanitizeString(rawClient.email).toLowerCase(),
    address: sanitizeString(rawClient.address),
  };

  const items = rawItems.map((it) => ({
    description: sanitizeString(it?.description),
    quantity: Number(it?.quantity),
    unitPrice: Number(it?.unitPrice),
  }));

  const rawTaxRate =
    raw.taxRate !== undefined && raw.taxRate !== null && raw.taxRate !== ""
      ? Number(raw.taxRate)
      : 7;

  let dueDate = undefined;
  if (
    raw.dueDate &&
    typeof raw.dueDate === "string" &&
    raw.dueDate.trim() !== ""
  ) {
    // Si viene en formato ISO completo con tiempo (e.g. 2026-09-22T00:00:00.000Z), tomar sólo YYYY-MM-DD
    dueDate = raw.dueDate.trim().slice(0, 10);
  }

  return {
    client,
    items,
    taxRate: rawTaxRate,
    language: raw.language === "en" ? "en" : "es",
    dueDate: dueDate || null,
    notes: raw.notes ? sanitizeString(raw.notes) : undefined,
  };
}

// ─── 6. Esquemas para MODERACIÓN (/api/admin-moderation) ──────────────────────
const moderationWordPreSchema = z.object({
  word: z.string({ required_error: "Palabra requerida" }).min(2).max(50),
});

const moderationWordPostSchema = z.object({
  word: z
    .string()
    .min(2, "La palabra debe tener al menos 2 caracteres")
    .max(50),
});

const moderationStatusSchema = z.object({
  status: z.enum(["approved", "rejected"], {
    errorMap: () => ({ message: "El status debe ser 'approved' o 'rejected'" }),
  }),
});

module.exports = {
  DEFAULT_MAX_BODY_BYTES,
  INVOICE_MAX_BODY_BYTES,
  enforceBodyLimit,
  stripControlCharacters,
  sanitizeString,
  escapeHtml,
  validateSpanishNif,
  validateClientTaxId,
  formatZodError,
  spanishNifSchema,
  phoneSchema,
  isoDateSchema,
  // Contacto
  contactPreSchema,
  contactPostSchema,
  normalizeContactInput,
  // Diagnóstico
  diagnosticoPreSchema,
  diagnosticoPostSchema,
  normalizeDiagnosticoInput,
  // Pagos
  paymentIntentPreSchema,
  paymentIntentPostSchema,
  normalizePaymentIntentInput,
  // Comentarios
  commentPreSchema,
  commentPostSchema,
  normalizeCommentInput,
  // Facturas
  invoiceCreatePreSchema,
  invoiceCreatePostSchema,
  normalizeInvoiceCreateInput,
  // Moderación
  moderationWordPreSchema,
  moderationWordPostSchema,
  moderationStatusSchema,
};
