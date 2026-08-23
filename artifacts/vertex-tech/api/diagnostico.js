const dotenv = require("dotenv");
const path = require("path");
const { kv } = require("@vercel/kv");
const { Ratelimit } = require("@upstash/ratelimit");

// Cargar y forzar la sobreescritura de variables de entorno (override: true) sólo en desarrollo local
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
}

const nodemailer = require("nodemailer");
const { drizzle } = require("drizzle-orm/neon-http");
const { eq } = require("drizzle-orm");
const {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
} = require("drizzle-orm/pg-core");

const { analyzeFreeText } = require("../src/utils/analyzeFreeText");
const { problemsData } = require("../src/data/problemsData");
// generateDiagnosisPDF arrastra el stack de @react-pdf/renderer. Se carga de
// forma perezosa dentro del handler para que un fallo ahí degrade a "correo sin
// adjunto" en lugar de impedir que el módulo cargue y tumbar todo el endpoint.

// Definición local del esquema para evitar dependencias externas en producción
const contactPreferenceEnum = pgEnum("contact_preference", [
  "cafe",
  "llamada",
  "email",
]);

const leadStatusEnum = pgEnum("lead_status", [
  "nuevo",
  "contactado",
  "en_proceso",
  "cerrado",
]);

const leadsTable = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  companyName: varchar("company_name", { length: 100 }).notNull(),
  sector: varchar("sector", { length: 50 }).notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  markedProblems: integer("marked_problems").array().notNull(),
  freeText: text("free_text"),
  detectedProblems: integer("detected_problems").array().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  contactPreference: contactPreferenceEnum("contact_preference").notNull(),
  status: leadStatusEnum("status").notNull().default("nuevo"),
  pdfSent: boolean("pdf_sent").notNull().default(false),
});

let dbInstance = null;

function getDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!dbInstance) {
    if (
      !connectionString ||
      connectionString === "undefined" ||
      connectionString.trim() === ""
    ) {
      throw new Error(
        `La variable de entorno DATABASE_URL no es válida o está vacía: "${connectionString}"`,
      );
    }
    dbInstance = drizzle(connectionString);
  }
  return dbInstance;
}

// Control de tasa (Rate Limiting) con Vercel KV / Upstash (3 peticiones por 1 hora)
let ratelimit = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    analytics: true,
    prefix: "ratelimit:diagnostico",
  });
}

/**
 * Evalúa el límite de tasa devolviendo el resultado detallado de Upstash.
 */
async function checkRateLimit(ip) {
  if (!ratelimit) return { success: true }; // Fallback si no están configuradas las variables de KV
  return await ratelimit.limit(ip);
}

async function sanitizeString(str) {
  if (typeof str !== "string") return "";
  const sanitizeHtmlModule = await import("sanitize-html");
  const sanitizeHtml = sanitizeHtmlModule.default || sanitizeHtmlModule;

  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
}

// Los datos del formulario se muestran como texto dentro de correos HTML.
// Escapar en el punto de salida evita depender de una regex como filtro XSS.
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

function sanitizeHeaderValue(value) {
  return String(value ?? "")
    .replace(/[\r\n]/g, " ")
    .trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Extracción y Saneamiento Seguro de IP
  const rawIp =
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";

  // Si la cabecera es un array o cadena separada por comas, extrae estrictamente la primera IP
  let clientIp = (Array.isArray(rawIp) ? rawIp[0] : rawIp).split(",")[0].trim();

  // Normalizar direcciones IP locales (IPv6 a IPv4)
  if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    clientIp = "127.0.0.1";
  }

  // Verificación de Rate Limit
  const { success, limit, remaining, reset } = await checkRateLimit(clientIp);

  // Inyección de encabezados HTTP estándar de Rate Limit (si ratelimit está activo)
  if (limit !== undefined) {
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);
  }

  if (!success) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please try again later." });
  }

  try {
    // 2. Validación de Entrada
    const {
      company_name,
      sector,
      size,
      email,
      marked_problems,
      free_text,
      contact_preference,
      phone,
    } = req.body ?? {};

    if (
      !company_name ||
      typeof company_name !== "string" ||
      company_name.length > 100 ||
      !sector ||
      typeof sector !== "string" ||
      sector.length > 50 ||
      !size ||
      typeof size !== "string" ||
      ![
        "1-9 empleados",
        "10-49 empleados",
        "50-249 empleados",
        "250+ empleados",
      ].includes(size) ||
      !email ||
      typeof email !== "string" ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !Array.isArray(marked_problems) ||
      !marked_problems.every(
        (id) =>
          Number.isInteger(id) &&
          problemsData.some((problem) => problem.id === id),
      ) ||
      typeof free_text !== "string" ||
      free_text.length > 5000 ||
      !contact_preference ||
      typeof contact_preference !== "string" ||
      !["cafe", "llamada", "email"].includes(contact_preference) ||
      (phone !== undefined &&
        phone !== null &&
        (typeof phone !== "string" || phone.length > 20))
    ) {
      return res
        .status(400)
        .json({ error: "Datos de entrada inválidos o incompletos." });
    }

    // Sanitización
    const cleanCompanyName = await sanitizeString(company_name);
    const cleanSector = await sanitizeString(sector);
    const cleanSize = await sanitizeString(size);
    const cleanEmail = await sanitizeString(email);
    const cleanFreeText = await sanitizeString(free_text);
    const cleanContactPreference = await sanitizeString(contact_preference);
    const cleanPhone = phone ? await sanitizeString(phone) : "";
    const htmlCompanyName = escapeHtml(cleanCompanyName);
    const htmlSector = escapeHtml(cleanSector);
    const htmlSize = escapeHtml(cleanSize);
    const htmlEmail = escapeHtml(cleanEmail);
    const htmlPhone = escapeHtml(cleanPhone);
    const htmlContactPreference = escapeHtml(cleanContactPreference);
    const htmlFreeText = escapeHtml(cleanFreeText);

    // 3. Procesamiento
    const detectedProblems = analyzeFreeText(cleanFreeText, marked_problems);
    const db = getDatabaseClient();

    // Insertar inicialmente con pdfSent = false
    const [insertedLead] = await db
      .insert(leadsTable)
      .values({
        companyName: cleanCompanyName,
        sector: cleanSector,
        size: cleanSize,
        markedProblems: marked_problems,
        freeText: cleanFreeText,
        detectedProblems: detectedProblems,
        email: cleanEmail,
        phone: cleanPhone,
        contactPreference: cleanContactPreference,
        status: "nuevo",
        pdfSent: false,
      })
      .returning();

    // C. Generación de PDF (Aislada en try/catch para evitar caídas fatales)
    const leadRecordForPdf = {
      id: insertedLead.id,
      companyName: cleanCompanyName,
      sector: cleanSector,
      size: cleanSize,
      markedProblems: marked_problems,
      detectedProblems: detectedProblems,
      email: cleanEmail,
      phone: cleanPhone,
      contactPreference: cleanContactPreference,
      createdAt: insertedLead.createdAt,
    };

    let pdfBuffer = null;
    try {
      const {
        generateDiagnosisPDF,
      } = require("../src/utils/generateDiagnosisPDF");
      pdfBuffer = await generateDiagnosisPDF(leadRecordForPdf, problemsData);

      // Actualizar estado en DB si se generó el PDF exitosamente
      await db
        .update(leadsTable)
        .set({ pdfSent: true })
        .where(eq(leadsTable.id, insertedLead.id));
    } catch (pdfErr) {
      console.error("[Diagnostico PDF Error]:", pdfErr);
    }

    // D. Configuración y Envío de Correos mediante Nodemailer
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const companyEmail = process.env.EMAIL_INTERNAL_NOTIFICATION || gmailUser; // Fallback al propio usuario si no existe env
    let emailSent = false;

    if (
      gmailUser &&
      gmailPass &&
      gmailUser.trim() !== "" &&
      gmailPass.trim() !== ""
    ) {
      try {
        let smtpHost = "smtp.gmail.com";

        if (process.env.NODE_ENV !== "production") {
          try {
            const dns = require("dns");
            const resolvedHost = await new Promise((resolve) => {
              const resolver = new dns.Resolver();
              resolver.setServers(["8.8.8.8", "1.1.1.1"]);
              const timeout = setTimeout(() => resolve("smtp.gmail.com"), 2500);
              resolver.resolve4("smtp.gmail.com", (err, addresses) => {
                clearTimeout(timeout);
                if (err || !addresses || !addresses.length) {
                  resolve("smtp.gmail.com");
                } else {
                  resolve(addresses[0]);
                }
              });
            });
            smtpHost = resolvedHost;
          } catch (dnsErr) {
            console.warn("[Diagnostico Local DNS Warning]:", dnsErr.message);
          }
        }

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: 465,
          secure: true,
          connectionTimeout: 3000,
          greetingTimeout: 3000,
          socketTimeout: 4000,
          tls: {
            servername: "smtp.gmail.com",
          },
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });

        const safeCompanyName = cleanCompanyName.replace(/[^a-zA-Z0-9]/g, "_");
        const pdfFilename = `Diagnostico_Vertex_${safeCompanyName}.pdf`;

        const pdfAttached = Boolean(pdfBuffer);
        const attachments = pdfAttached
          ? [
              {
                filename: pdfFilename,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ]
          : [];

        const clientMailHtml = pdfAttached
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <h2 style="color: #2563eb;">Diagnóstico Tecnológico Completado</h2>
              <p>Hola,</p>
              <p>Agradecemos tu interés en optimizar la infraestructura tecnológica de <strong>${htmlCompanyName}</strong>.</p>
              <p>Hemos adjuntado a este correo tu reporte formal en formato PDF con la hoja de ruta y recomendaciones técnicas diseñadas a medida para tu empresa.</p>
              <p>Quedamos a tu disposición para cualquier duda o consulta.</p>
              <br/>
              <p>Atentamente,</p>
              <p><strong>El equipo de Vertex Tech Digital</strong></p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <h2 style="color: #2563eb;">Diagnóstico Tecnológico Registrado</h2>
              <p>Hola,</p>
              <p>Hemos recibido los datos de diagnóstico tecnológico para <strong>${htmlCompanyName}</strong> correctamente.</p>
              <p>Un consultor de nuestro equipo evaluará tu solicitud y se pondrá en contacto contigo muy pronto a través del canal seleccionado para detallarte la hoja de ruta.</p>
              <br/>
              <p>Atentamente,</p>
              <p><strong>El equipo de Vertex Tech Digital</strong></p>
            </div>
          `;

        const mailPromises = [
          transporter.sendMail({
            from: `"Vertex Tech Digital" <${gmailUser}>`,
            to: cleanEmail,
            subject:
              "Tu Reporte de Diagnóstico Tecnológico - Vertex Tech Digital",
            html: clientMailHtml,
            attachments,
          }),
        ];

        // Solo enviar email administrativo si tenemos un destinatario válido
        if (companyEmail && companyEmail.trim() !== "") {
          const markedProblemsNames = marked_problems
            .map((id) => {
              const prob = problemsData.find((p) => p.id === id);
              return prob ? prob.name : `Problema #${id}`;
            })
            .join(", ");

          const detectedProblemsNames = detectedProblems
            .map((id) => {
              const prob = problemsData.find((p) => p.id === id);
              return prob ? prob.name : `Problema #${id}`;
            })
            .join(", ");
          const htmlMarkedProblemsNames = escapeHtml(markedProblemsNames);
          const htmlDetectedProblemsNames = escapeHtml(detectedProblemsNames);

          mailPromises.push(
            transporter.sendMail({
              from: `"Vertex Tech Digital Alert" <${gmailUser}>`,
              to: companyEmail,
              subject: `[Nuevo Lead] Diagnóstico completado - ${sanitizeHeaderValue(cleanCompanyName)}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; color: #333;">
                  <h2 style="color: #2563eb;">Alerta: Nuevo Lead de Diagnóstico</h2>
                  <p>Se ha registrado un diagnóstico automatizado para el siguiente lead:</p>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <tr><td style="padding: 6px; font-weight: bold; width: 150px;">UUID Lead:</td><td>${escapeHtml(insertedLead.id)}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Razón Social:</td><td>${htmlCompanyName}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Sector:</td><td>${htmlSector}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Tamaño:</td><td>${htmlSize}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Email:</td><td>${htmlEmail}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Teléfono:</td><td>${htmlPhone || "No proporcionado"}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Preferencia:</td><td>${htmlContactPreference}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Problemas Marcados:</td><td>${htmlMarkedProblemsNames}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">Problemas Detectados:</td><td>${htmlDetectedProblemsNames || "Ninguno detectado automáticamente"}</td></tr>
                    <tr><td style="padding: 6px; font-weight: bold;">PDF Generado:</td><td>${pdfAttached ? "Sí" : "Falló (Ver logs)"}</td></tr>
                  </table>
                  <p><strong>Mensaje del cliente:</strong></p>
                  <blockquote style="background: #f3f4f6; padding: 10px; border-left: 4px solid #2563eb;">${htmlFreeText || "Sin comentarios."}</blockquote>
                </div>
              `,
              attachments,
            }),
          );
        }

        await Promise.race([
          Promise.all(mailPromises),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("SMTP Delivery Timeout")), 5000),
          ),
        ]);

        emailSent = true;
      } catch (emailErr) {
        console.error("[Diagnostico Email Error]:", emailErr);
      }
    } else {
      console.warn(
        "[Diagnostico API Warning]: GMAIL SMTP credentials are not configured. Skipping email delivery.",
      );
    }

    return res.status(201).json({
      success: true,
      leadId: insertedLead.id,
      pdfGenerated: Boolean(pdfBuffer),
      emailSent: emailSent,
      message: emailSent
        ? "Diagnóstico guardado y correos enviados."
        : "Diagnóstico registrado exitosamente en el sistema.",
    });
  } catch (error) {
    console.error("[Diagnostico API Error]:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

module.exports.escapeHtml = escapeHtml;
module.exports.sanitizeHeaderValue = sanitizeHeaderValue;
module.exports.sanitizeString = sanitizeString;
