const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, company, message } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  if (!message || typeof message !== "string" || message.trim().length < 10) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `"Vertex Tech Contact" <${gmailUser}>`,
      to: process.env.EMAIL_INTERNAL_NOTIFICATION || process.env.GMAIL_USER,
      replyTo: email,
      subject: `Nueva consulta de ${name.trim()}${company ? ` (${company})` : ""}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0d1117;color:#e6edf3;border-radius:8px;">
          <h2 style="color:#3b82f6;margin-bottom:24px;">Nueva solicitud — Vertex Tech</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#8b949e;width:120px;">Nombre</td><td style="padding:8px 0;font-weight:600;">${name.trim()}</td></tr>
            <tr><td style="padding:8px 0;color:#8b949e;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#3b82f6;">${email}</a></td></tr>
            ${company ? `<tr><td style="padding:8px 0;color:#8b949e;">Empresa</td><td style="padding:8px 0;">${company}</td></tr>` : ""}
          </table>
          <hr style="border:none;border-top:1px solid #21262d;margin:24px 0;"/>
          <h3 style="color:#8b949e;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Mensaje</h3>
          <p style="line-height:1.7;margin:0;">${message.trim().replace(/\n/g, "<br>")}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }

  return res.status(200).json({ success: true });
};
