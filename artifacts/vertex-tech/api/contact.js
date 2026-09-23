const nodemailer = require("nodemailer");
const {
  enforceBodyLimit,
  contactPreSchema,
  contactPostSchema,
  normalizeContactInput,
  formatZodError,
  escapeHtml,
  maskEmail,
  maskName,
} = require("./_validation");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Límite de tamaño del body
  if (!enforceBodyLimit(req, res)) return;

  // 2. Validación pre-normalización (tipos y límites crudos)
  const preResult = contactPreSchema.safeParse(req.body ?? {});
  if (!preResult.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: formatZodError(preResult.error),
    });
  }

  // 3. Normalización y saneamiento
  const normalized = normalizeContactInput(preResult.data);

  // 4. Validación post-normalización (formato de email, restricciones de longitud limpia)
  const postResult = contactPostSchema.safeParse(normalized);
  if (!postResult.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: formatZodError(postResult.error),
    });
  }

  const { name, email, company, message } = postResult.data;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompany = company ? escapeHtml(company) : "";
  const safeMessageHtml = escapeHtml(message).replace(/\n/g, "<br>");

  try {
    await transporter.sendMail({
      from: `"Vertex Tech Contact" <${gmailUser}>`,
      to: process.env.EMAIL_INTERNAL_NOTIFICATION || process.env.GMAIL_USER,
      replyTo: email,
      subject: `Nueva consulta de ${name}${company ? ` (${company})` : ""}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0d1117;color:#e6edf3;border-radius:8px;">
          <h2 style="color:#3b82f6;margin-bottom:24px;">Nueva solicitud — Vertex Tech</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#8b949e;width:120px;">Nombre</td><td style="padding:8px 0;font-weight:600;">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#8b949e;">Email</td><td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#3b82f6;">${safeEmail}</a></td></tr>
            ${company ? `<tr><td style="padding:8px 0;color:#8b949e;">Empresa</td><td style="padding:8px 0;">${safeCompany}</td></tr>` : ""}
          </table>
          <hr style="border:none;border-top:1px solid #21262d;margin:24px 0;"/>
          <h3 style="color:#8b949e;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Mensaje</h3>
          <p style="line-height:1.7;margin:0;">${safeMessageHtml}</p>
        </div>
      `,
    });

    console.info(
      JSON.stringify({
        logType: "audit",
        action: "CONTACT_FORM_SUBMITTED",
        status: "SUCCESS",
        actor: {
          name: maskName(name),
          email: maskEmail(email),
          company: company ? maskName(company) : undefined,
        },
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        logType: "technical",
        action: "CONTACT_FORM_SUBMITTED",
        status: "FAILURE",
        error: err instanceof Error ? err.message : "Failed to send email",
        timestamp: new Date().toISOString(),
      }),
    );
    return res.status(500).json({ error: "Failed to send email" });
  }

  return res.status(200).json({ success: true });
};
