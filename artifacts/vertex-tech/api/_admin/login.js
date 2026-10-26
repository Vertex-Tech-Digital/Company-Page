// POST /api/admin-login
// Autentica al administrador contra el hash bcrypt de admin_users y abre
// sesión. La contraseña se define únicamente vía lib/db/seed.ts
// (ADMIN_USERNAME/ADMIN_PASSWORD como argumentos del seed, no como env vars
// permanentes de la app) — ver ese archivo para rotarla.
//
// Body esperado:
// { "username": "anier", "password": "contraseña_real" }
//
// Respuesta exitosa:
// { "success": true, "username": "anier" }
//
// La sesión viaja en una cookie httpOnly (Set-Cookie: admin_token=...),
// nunca en el body — el frontend no debe (ni puede) leerla desde JS.
// Las rutas protegidas la validan solas vía verifyAuth (ver _auth.js).
//
// Contra fuerza bruta: límites de intentos por IP, por usuario y por
// IP + usuario, y una alerta por email al acumular fallos (todo en Vercel
// KV — ver los comentarios de cada constante).

const { createHash } = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { pool } = require("../../server/db.js");
const { signSessionToken, setSessionCookie } = require("../_auth");
const {
  createRateLimiter,
  createThresholdCounter,
  getClientIp,
} = require("../_rate-limit.js");
const {
  ADMIN_USERNAME_MAX_LENGTH,
  adminLoginSchema,
  escapeHtml,
  maskName,
} = require("../_validation");

// Tres límites, todos en ventanas de 15 min, que cuentan cada intento (no
// solo los fallidos). La respuesta es el mismo 429 genérico en los tres
// casos, para no revelar cuál saltó.
//
// IP, 10 intentos con cualquier usuario: una máquina probando muchos
// usuarios distintos (password spraying). Se comprueba antes de validar el
// body, así que también frena peticiones basura.
const isIpRateLimited = createRateLimiter({
  prefix: "admin-login-ip",
  count: 10,
  window: "15 m",
});

// IP + usuario, 5 intentos: fuerza bruta clásica contra una cuenta desde una
// sola máquina. Es el que salta primero, sin bloquear a un admin real que se
// equivoca de contraseña una o dos veces.
const isIpUserRateLimited = createRateLimiter({
  prefix: "admin-login-ip-user",
  count: 5,
  window: "15 m",
});

// Usuario, 10 intentos sumando todas las IPs: ataque distribuido (botnet,
// rotación de IPs) contra una misma cuenta. Es el doble que IP + usuario,
// así que una sola IP nunca llega a él: hacen falta al menos dos. Tiene una
// contrapartida conocida: quien sepa el usuario puede dejar al admin real
// sin entrar durante la ventana usando varias IPs. La alerta de abajo avisa
// cuando eso pasa.
const isUserRateLimited = createRateLimiter({
  prefix: "admin-login-user",
  count: 10,
  window: "15 m",
});

// Alerta por email al llegar a 10 intentos fallidos (401) o bloqueados
// (429) dentro de una misma ventana fija de 1 h, sumando todas las IPs y
// usuarios. Sale una sola por ventana; el resto de fallos de esa hora solo
// queda en los logs de auditoría.
const ALERT_THRESHOLD = 10;
const reachesAlertThreshold = createThresholdCounter({
  prefix: "admin-login-failures",
  count: ALERT_THRESHOLD,
  window: "1 h",
});

const TOO_MANY_ATTEMPTS = "Demasiados intentos. Inténtalo de nuevo más tarde.";

const FAILURE_REASON_LABELS = {
  RATE_LIMITED: "bloqueado por exceso de intentos",
  USER_NOT_FOUND: "usuario inexistente",
  INVALID_PASSWORD: "contraseña incorrecta",
};

async function sendFailedLoginAlert({ username, reason }) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  // Sin email configurado la alerta no puede salir, pero el login sigue
  // respondiendo igual: el aviso es un extra, no una condición del login.
  if (!gmailUser || !gmailPass) {
    console.error(
      JSON.stringify({
        logType: "technical",
        action: "ADMIN_LOGIN_ALERT",
        status: "FAILURE",
        error: "Email service not configured",
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  const safeUsername = escapeHtml(maskName(username));
  const safeReason = escapeHtml(FAILURE_REASON_LABELS[reason] ?? reason);
  const now = new Date().toISOString();

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"Vertex Tech Admin" <${gmailUser}>`,
      to: process.env.EMAIL_INTERNAL_NOTIFICATION || gmailUser,
      subject: `Alerta de seguridad: ${ALERT_THRESHOLD} intentos fallidos de acceso al panel admin`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0d1117;color:#e6edf3;border-radius:8px;">
          <h2 style="color:#f85149;margin-bottom:24px;">Intentos fallidos en el panel admin</h2>
          <p style="line-height:1.7;margin:0 0 16px;">Se han registrado ${ALERT_THRESHOLD} intentos de acceso fallidos o bloqueados al panel admin en menos de una hora. Hasta que acabe esa franja de una hora no se enviarán más avisos; los intentos siguientes quedan en los logs.</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#8b949e;width:200px;">Último usuario probado</td><td style="padding:8px 0;font-weight:600;">${safeUsername}</td></tr>
            <tr><td style="padding:8px 0;color:#8b949e;">Motivo del último intento</td><td style="padding:8px 0;">${safeReason}</td></tr>
            <tr><td style="padding:8px 0;color:#8b949e;">Fecha (UTC)</td><td style="padding:8px 0;">${now}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #21262d;margin:24px 0;"/>
          <p style="line-height:1.7;margin:0;">Si has sido tú, puedes ignorar este aviso. Si no, revisa los logs de Vercel (logType "audit", action "ADMIN_LOGIN") y valora rotar la contraseña con el seed de lib/db/seed.ts, que además cierra todas las sesiones abiertas.</p>
        </div>
      `,
    });

    console.warn(
      JSON.stringify({
        logType: "audit",
        action: "ADMIN_LOGIN_ALERT",
        status: "SUCCESS",
        threshold: ALERT_THRESHOLD,
        timestamp: now,
      }),
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        logType: "technical",
        action: "ADMIN_LOGIN_ALERT",
        status: "FAILURE",
        error: err instanceof Error ? err.message : "Failed to send email",
        timestamp: new Date().toISOString(),
      }),
    );
  }
}

// Deja el intento fallido en el log de auditoría (nunca la contraseña, y el
// usuario enmascarado) y manda la alerta si es el que alcanza el umbral.
async function registerFailure({ username, reason, limiter }) {
  // Antes de validar el body el usuario puede venir con cualquier tipo o
  // longitud: se recorta para no volcar al log lo que mande el cliente.
  const loggedUsername =
    typeof username === "string"
      ? username.slice(0, ADMIN_USERNAME_MAX_LENGTH)
      : undefined;

  console.warn(
    JSON.stringify({
      logType: "audit",
      action: "ADMIN_LOGIN",
      status: "FAILURE",
      actor: { username: maskName(loggedUsername) },
      reason,
      limiter,
      timestamp: new Date().toISOString(),
    }),
  );

  if (await reachesAlertThreshold("all")) {
    await sendFailedLoginAlert({ username: loggedUsername, reason });
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp = getClientIp(req);
  if (await isIpRateLimited(clientIp)) {
    await registerFailure({
      username: req.body?.username,
      reason: "RATE_LIMITED",
      limiter: "ip",
    });
    return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const parsed = adminLoginSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const { password } = parsed.data;
  // Misma normalización con la que el seed guarda el usuario, así "Anier " y
  // "anier" son la misma cuenta también para los límites.
  const username = parsed.data.username.toLowerCase().trim();
  // En KV va un hash del usuario, no el texto: si alguien escribe la
  // contraseña en el campo de usuario, no queda en claro en las claves.
  const userKey = createHash("sha256").update(username).digest("hex");

  if (await isIpUserRateLimited(`${clientIp}:${userKey}`)) {
    await registerFailure({
      username,
      reason: "RATE_LIMITED",
      limiter: "ip_user",
    });
    return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
  }
  if (await isUserRateLimited(userKey)) {
    await registerFailure({
      username,
      reason: "RATE_LIMITED",
      limiter: "user",
    });
    return res.status(429).json({ error: TOO_MANY_ATTEMPTS });
  }

  try {
    // Buscar el usuario en la base de datos
    const result = await pool.query(
      "SELECT id, username, password_hash, session_version FROM admin_users WHERE username = $1 LIMIT 1",
      [username],
    );

    // Respuesta genérica tanto si el usuario no existe como si la
    // contraseña es incorrecta — no damos pistas sobre cuál falló.
    // bcrypt.compare ya es en sí mismo resistente a timing attacks: su
    // costo depende del salt/rounds embebidos en el hash, no de en qué
    // carácter difiere la comparación.
    if (result.rows.length === 0) {
      await registerFailure({ username, reason: "USER_NOT_FOUND" });
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      await registerFailure({ username, reason: "INVALID_PASSWORD" });
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = signSessionToken({
      id: user.id,
      username: user.username,
      sessionVersion: user.session_version,
    });
    setSessionCookie(res, token);

    console.info(
      JSON.stringify({
        logType: "audit",
        action: "ADMIN_LOGIN",
        status: "SUCCESS",
        actor: { username: user.username },
        timestamp: new Date().toISOString(),
      }),
    );

    return res.status(200).json({ success: true, username: user.username });
  } catch (err) {
    console.error(
      JSON.stringify({
        logType: "technical",
        action: "ADMIN_LOGIN",
        status: "FAILURE",
        error: err instanceof Error ? err.message : "Internal Server Error",
        timestamp: new Date().toISOString(),
      }),
    );
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
