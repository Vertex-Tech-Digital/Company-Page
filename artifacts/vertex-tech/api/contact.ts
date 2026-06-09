import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }

  const { name, email, company, message } = parsed.data;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"Vertex Tech Contact" <${gmailUser}>`,
    to: "***REMOVED***",
    replyTo: email,
    subject: `Nueva consulta de ${name}${company ? ` (${company})` : ""}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0d1117;color:#e6edf3;border-radius:8px;">
        <h2 style="color:#3b82f6;margin-bottom:24px;">Nueva solicitud — Vertex Tech</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#8b949e;width:120px;">Nombre</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#8b949e;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#3b82f6;">${email}</a></td></tr>
          ${company ? `<tr><td style="padding:8px 0;color:#8b949e;">Empresa</td><td style="padding:8px 0;">${company}</td></tr>` : ""}
        </table>
        <hr style="border:none;border-top:1px solid #21262d;margin:24px 0;"/>
        <h3 style="color:#8b949e;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Mensaje</h3>
        <p style="line-height:1.7;margin:0;">${message.replace(/\n/g, "<br>")}</p>
      </div>
    `,
  });

  return res.status(200).json({ success: true });
}
