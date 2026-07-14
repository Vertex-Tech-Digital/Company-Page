import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { drizzle } from "drizzle-orm/neon-http";
import { leadsTable } from "./leads";
import { analyzeFreeText } from "../src/utils/analyzeFreeText";
import { problemsData } from "../src/data/problemsData";
import { generateDiagnosisPDF } from "../src/utils/generateDiagnosisPDF";

// Cargar y forzar la sobreescritura de variables de entorno (override: true)
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), override: true });
dotenv.config({ path: path.resolve(__dirname, "../env"), override: true });
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });
dotenv.config({ override: true });

let dbInstance: any = null;

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
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_COUNT = 3;
const HOUR_IN_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
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

function sanitizeString(str: any): string {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Rate Limiting por IP
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "127.0.0.1";
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

    // 4. Límite de tiempo operativo de 10 segundos (9.5s reales)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout de la operación superado (10s)")), 9500)
    );

    // Ejecución operativa
    const result = await Promise.race([
      (async () => {
        // A. Obtener cliente de base de datos inicializado perezosamente
        const db = getDatabaseClient();

        // B. Persistencia en base de datos con Drizzle (vía HTTP)
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
        const pdfBase64 = pdfBuffer.toString("base64");

        // D. Configuración de Nodemailer (Opcional para pruebas locales)
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD;
        const companyEmail = process.env.EMAIL_INTERNAL_NOTIFICATION;
        let emailSent = false;

        if (gmailUser && gmailPass && gmailUser.trim() !== "" && gmailPass.trim() !== "") {
          // Intentar resolver de forma rápida usando DNS públicos para evitar timeouts por DNS locales fallidos
          const resolvedHost = await new Promise<string>((resolve) => {
            const resolver = new dns.Resolver();
            resolver.setServers(["8.8.8.8", "1.1.1.1"]);
            const timeout = setTimeout(() => resolve("smtp.gmail.com"), 3000);
            resolver.resolve4("smtp.gmail.com", (err, addresses) => {
              clearTimeout(timeout);
              if (err || !addresses || !addresses.length) {
                resolve("smtp.gmail.com");
              } else {
                resolve(addresses[0]);
              }
            });
          });

          const transporter = nodemailer.createTransport({
            host: resolvedHost,
            port: 465,
            secure: true,
            tls: {
              servername: "smtp.gmail.com",
            },
            auth: {
              user: gmailUser,
              pass: gmailPass,
            },
          });

          // Nombre de archivo seguro
          const safeCompanyName = cleanCompanyName.replace(/[^a-zA-Z0-9]/g, "_");
          const pdfFilename = `Diagnostico_Vertex_${safeCompanyName}.pdf`;

          // E. Envíos simultáneos de correo
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
                  <tr><td style="padding: 6px; font-weight: bold;">Problemas Marcados:</td><td>${marked_problems.join(", ")}</td></tr>
                  <tr><td style="padding: 6px; font-weight: bold;">Problemas Detectados:</td><td>${detectedProblems.join(", ")}</td></tr>
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

        return {
          ...insertedLead,
          pdfGenerated: true,
          emailSent
        };
      })(),
      timeoutPromise,
    ]);

    return res.status(201).json({
      success: true,
      leadId: (result as any).id,
      pdfGenerated: (result as any).pdfGenerated,
      emailSent: (result as any).emailSent,
      message: (result as any).emailSent 
        ? "Diagnóstico guardado y correos enviados." 
        : "Diagnóstico guardado y PDF generado. Envío de correo omitido (sin credenciales SMTP)."
    });
  } catch (error: any) {
    console.error("[Diagnostico API Error]:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
