const dotenv = require("dotenv");
const path = require("path");

// Cargar y forzar la sobreescritura de variables de entorno (override: true) sólo en desarrollo local
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
}

const nodemailer = require("nodemailer");
const { drizzle } = require("drizzle-orm/neon-http");
const { pgTable, pgEnum, uuid, timestamp, varchar, integer, text, boolean } = require("drizzle-orm/pg-core");

const { analyzeFreeText } = require("../src/utils/analyzeFreeText");
const { problemsData } = require("../src/data/problemsData");
const { generateDiagnosisPDF } = require("../src/utils/generateDiagnosisPDF");

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

const leadsTable = pgTable(
  "leads",
  {
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
    pdfSent: boolean("pdf_sent").notNull().default(true),
  }
);

let dbInstance = null;

function getDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!dbInstance) {
    if (!connectionString || connectionString === "undefined" || connectionString.trim() === "") {
      throw new Error(
        `La variable de entorno DATABASE_URL no es válida o está vacía: "${connectionString}"`
      );
    }
    // Al pasar directamente la cadena de conexión como string, drizzle(connectionString)
    // se encarga de inicializar internamente y de forma correcta el cliente HTTP de Neon.
    dbInstance = drizzle(connectionString);
  }
  return dbInstance;
}

// Control de tasa (Rate Limiting) en memoria
const rateLimitMap = new Map();
const RATE_LIMIT_COUNT = 3;
const HOUR_IN_MS = 60 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const activeTimestamps = timestamps.filter((t) => now - t < HOUR_IN_MS);
  
  if (activeTimestamps.length >= RATE_LIMIT_COUNT) {
    rateLimitMap.set(ip, activeTimestamps);
    return true;
  }
  
  activeTimestamps.push(now);
  rateLimitMap.set(ip, activeTimestamps);
  return false;
}

function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Rate Limiting por IP
  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "127.0.0.1";
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
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
      !company_name || typeof company_name !== "string" ||
      !sector || typeof sector !== "string" ||
      !size || typeof size !== "string" ||
      !email || typeof email !== "string" || !email.includes("@") ||
      !Array.isArray(marked_problems) || !marked_problems.every((id) => typeof id === "number") ||
      typeof free_text !== "string" ||
      !contact_preference || typeof contact_preference !== "string"
    ) {
      return res.status(400).json({ error: "Datos de entrada inválidos o incompletos." });
    }

    // Sanitización
    const cleanCompanyName = sanitizeString(company_name);
    const cleanSector = sanitizeString(sector);
    const cleanSize = sanitizeString(size);
    const cleanEmail = sanitizeString(email);
    const cleanFreeText = sanitizeString(free_text);
    const cleanContactPreference = sanitizeString(contact_preference);
    const cleanPhone = phone ? sanitizeString(phone) : "";

    // 3. Procesamiento: determinar problemas detectados automáticamente
    const detectedProblems = analyzeFreeText(cleanFreeText, marked_problems);

    // A. Obtener cliente de base de datos inicializado perezosamente (vía HTTP)
    const db = getDatabaseClient();

    // B. Persistencia en base de datos con Drizzle (vía HTTP, evitando ECONNRESET)
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
        pdfSent: true,
      })
      .returning();

    // C. Generación de PDF
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

    const pdfBuffer = await generateDiagnosisPDF(leadRecordForPdf, problemsData);

    // D. Configuración de Nodemailer (Opcional para pruebas locales)
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const companyEmail = process.env.EMAIL_INTERNAL_NOTIFICATION;
    let emailSent = false;

    if (gmailUser && gmailPass && gmailUser.trim() !== "" && gmailPass.trim() !== "") {
      let smtpHost = "smtp.gmail.com";

      // En desarrollo local resolvemos rápido usando DNS públicos para evitar lags locales.
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
        connectionTimeout: 4000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
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

      const clientMail = transporter.sendMail({
        from: `"Vertex Tech Digital" <${gmailUser}>`,
        to: cleanEmail,
        subject: "Tu Reporte de Diagnóstico Tecnológico - Vertex Tech Digital",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Diagnóstico Tecnológico Completado</h2>
            <p>Hola,</p>
            <p>Agradecemos tu interés en optimizar la infraestructura tecnológica de <strong>${cleanCompanyName}</strong>.</p>
            <p>Hemos adjuntado a este correo tu reporte formal en formato PDF con la hoja de ruta y recomendaciones técnicas diseñadas a medida para tu empresa.</p>
            <p>Quedamos a tu disposición para cualquier duda o consulta.</p>
            <br/>
            <p>Atentamente,</p>
            <p><strong>El equipo de Vertex Tech Digital</strong></p>
          </div>
        `,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

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

      const adminMail = transporter.sendMail({
        from: `"Vertex Tech Digital Alert" <${gmailUser}>`,
        to: companyEmail,
        subject: `[Nuevo Lead] Diagnóstico completado - ${cleanCompanyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Alerta: Nuevo Lead de Diagnóstico</h2>
            <p>Se ha registrado un diagnóstico automatizado para el siguiente lead:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr><td style="padding: 6px; font-weight: bold; width: 150px;">UUID Lead:</td><td>${insertedLead.id}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Razón Social:</td><td>${cleanCompanyName}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Sector:</td><td>${cleanSector}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Tamaño:</td><td>${cleanSize}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Email:</td><td>${cleanEmail}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Teléfono:</td><td>${cleanPhone || "No proporcionado"}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Preferencia:</td><td>${cleanContactPreference}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Problemas Marcados:</td><td>${markedProblemsNames}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Problemas Detectados:</td><td>${detectedProblemsNames || "Ninguno detectado automáticamente"}</td></tr>
            </table>
            <p><strong>Mensaje del cliente:</strong></p>
            <blockquote style="background: #f3f4f6; padding: 10px; border-left: 4px solid #2563eb;">${cleanFreeText || "Sin comentarios."}</blockquote>
          </div>
        `,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      await Promise.all([clientMail, adminMail]);
      emailSent = true;
    } else {
      console.warn("[Diagnostico API Warning]: GMAIL SMTP credentials are not configured. Skipping email delivery.");
    }

    return res.status(201).json({
      success: true,
      leadId: insertedLead.id,
      pdfGenerated: true,
      emailSent: emailSent,
      message: emailSent 
        ? "Diagnóstico guardado y correos enviados." 
        : "Diagnóstico guardado y PDF generado. Envío de correo omitido (sin credenciales SMTP)."
    });
  } catch (error) {
    console.error("[Diagnostico API Error]:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
