const dotenv = require("dotenv");
const path = require("path");
const { kv } = require("@vercel/kv");
const { Ratelimit } = require("@upstash/ratelimit");

// Cargar y forzar la sobreescritura de variables de entorno (override: true) sólo en desarrollo local
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
}

const nodemailer = require("nodemailer");
const xss = require("xss");
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
  jsonb,
} = require("drizzle-orm/pg-core");

const { problemsData } = require("../src/data/problemsData");
const { resolveDiagnosis } = require("../src/utils/diagnosisEngine");
const {
  enforceBodyLimit,
  diagnosticoPreSchema,
  diagnosticoPostSchema,
  normalizeDiagnosticoInput,
  formatZodError,
  sanitizeString,
  escapeHtml,
  maskEmail,
  maskPhone,
  maskName,
} = require("./_validation");

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

const diagnosisSourceEnum = pgEnum("diagnosis_source", ["ai", "fallback"]);

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
  diagnosisSource: diagnosisSourceEnum("diagnosis_source"),
  aiDiagnosis: text("ai_diagnosis"),
  aiRoadmap: jsonb("ai_roadmap"),
  aiModel: varchar("ai_model", { length: 100 }),
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
        "Configuración de base de datos no disponible o inválida",
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
  if (!ratelimit) return { success: true };
  return await ratelimit.limit(ip);
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

  // Límite de tamaño del body
  if (!enforceBodyLimit(req, res)) return;

  // 1. Extracción y Saneamiento Seguro de IP
  const rawIp =
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";

  let clientIp = (Array.isArray(rawIp) ? rawIp[0] : rawIp).split(",")[0].trim();

  if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    clientIp = "127.0.0.1";
  }

  // Verificación de Rate Limit
  const { success, limit, remaining, reset } = await checkRateLimit(clientIp);

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
    // 2. Validación de Entrada (Pre y Post Normalización con Zod)
    const preResult = diagnosticoPreSchema.safeParse(req.body ?? {});
    if (!preResult.success) {
      return res.status(400).json({
        error: "Datos de entrada inválidos o incompletos.",
        details: formatZodError(preResult.error),
      });
    }

    const normalized = normalizeDiagnosticoInput(preResult.data);
    const postResult = diagnosticoPostSchema.safeParse(normalized);
    if (!postResult.success) {
      return res.status(400).json({
        error: formatZodError(postResult.error),
        details: postResult.error.issues,
      });
    }

    const {
      company_name: cleanCompanyName,
      sector: cleanSector,
      size: cleanSize,
      email: cleanEmail,
      free_text: cleanFreeText,
      contact_preference: cleanContactPreference,
      phone: cleanPhone,
      marked_problems,
    } = postResult.data;

    const htmlCompanyName = escapeHtml(cleanCompanyName);
    const htmlSector = escapeHtml(cleanSector);
    const htmlSize = escapeHtml(cleanSize);
    const htmlEmail = escapeHtml(cleanEmail);
    const htmlPhone = escapeHtml(cleanPhone || "");
    const htmlContactPreference = escapeHtml(cleanContactPreference);
    const htmlFreeText = escapeHtml(cleanFreeText);

    // 3. Procesamiento: pipeline en cascada resiliente
    // (Gemini -> OpenRouter -> Fallback determinista local). Nunca lanza 500
    // por fallo de IA: el lead se captura igualmente con source 'fallback'.
    const diagnosis = await resolveDiagnosis({
      formData: {
        company_name: cleanCompanyName,
        sector: cleanSector,
        size: cleanSize,
        free_text: cleanFreeText,
      },
      markedProblemIds: marked_problems,
    });
    const diagnosisSource = diagnosis.source;
    const { detectedProblems, aiDiagnosis, aiRoadmap, aiModel, aiProvider } =
      diagnosis;

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
        diagnosisSource,
        aiDiagnosis,
        aiRoadmap,
        aiModel,
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
      diagnosisSource,
      aiDiagnosis,
      aiRoadmap,
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
    const companyEmail = process.env.EMAIL_INTERNAL_NOTIFICATION || gmailUser;
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
                  <p><strong>Origen del diagnóstico:</strong> ${escapeHtml(diagnosisSource)}${aiProvider ? ` (${escapeHtml(aiProvider)}${aiModel ? ` · ${escapeHtml(aiModel)}` : ""})` : ""}</p>
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

    console.info(
      JSON.stringify({
        logType: "audit",
        action: "DIAGNOSIS_SUBMITTED",
        status: "SUCCESS",
        leadId: insertedLead.id,
        actor: {
          company: maskName(cleanCompanyName),
          email: maskEmail(cleanEmail),
          phone: cleanPhone ? maskPhone(cleanPhone) : undefined,
        },
        timestamp: new Date().toISOString(),
      }),
    );

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
    console.error(
      JSON.stringify({
        logType: "technical",
        action: "DIAGNOSIS_SUBMITTED",
        status: "FAILURE",
        error: error instanceof Error ? error.message : "Internal Server Error",
        timestamp: new Date().toISOString(),
      }),
    );
    return res
      .status(500)
      .json({ error: "Error interno al procesar el diagnóstico" });
  }
};

module.exports.escapeHtml = escapeHtml;
module.exports.sanitizeHeaderValue = sanitizeHeaderValue;
module.exports.sanitizeString = sanitizeString;
module.exports.getDatabaseClient = getDatabaseClient;
