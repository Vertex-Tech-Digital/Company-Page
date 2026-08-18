import { Router, type IRouter } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";

const router: IRouter = Router();

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
});

router.post("/contact", async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }

  const { name, email, company, message } = parsed.data;

  const gmailUser = process.env["GMAIL_USER"];
  const gmailPass = process.env["GMAIL_APP_PASSWORD"];
  const notificationEmail = process.env["EMAIL_INTERNAL_NOTIFICATION"];

  if (!gmailUser || !gmailPass || !notificationEmail) {
    req.log.error("Email service not configured");
    res.status(500).json({ error: "Email service not configured" });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const mailOptions = {
    from: `"Vertex Tech Contact" <${gmailUser}>`,
    to: notificationEmail,
    replyTo: email,
    subject: `Nueva consulta de ${name}${company ? ` (${company})` : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0d1117; color: #e6edf3; border-radius: 8px;">
        <h2 style="color: #3b82f6; margin-bottom: 24px;">Nueva solicitud de contacto — Vertex Tech</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #8b949e; width: 120px;">Nombre</td>
            <td style="padding: 8px 0; font-weight: 600;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8b949e;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #3b82f6;">${email}</a></td>
          </tr>
          ${
            company
              ? `<tr>
            <td style="padding: 8px 0; color: #8b949e;">Empresa</td>
            <td style="padding: 8px 0;">${company}</td>
          </tr>`
              : ""
          }
        </table>
        <hr style="border: none; border-top: 1px solid #21262d; margin: 24px 0;" />
        <h3 style="color: #8b949e; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Mensaje</h3>
        <p style="line-height: 1.7; margin: 0;">${message.replace(/\n/g, "<br>")}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    req.log.info({ name, email }, "Contact email sent");
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to send contact email");
    res
      .status(500)
      .json({ error: "No se pudo enviar el email. Inténtalo de nuevo." });
  }
});

export default router;
