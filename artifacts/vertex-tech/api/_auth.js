// _auth.js — helper compartido para las rutas protegidas del panel admin.
// El prefijo _ hace que Vercel NO lo exponga como ruta pública.
//
// La sesión viaja en una cookie httpOnly (nunca en localStorage/JS), así
// que verifyAuth ya no necesita el header Authorization.
//
// Uso en una ruta protegida:
//   const { verifyAuth } = require("./_auth");
//   const payload = await verifyAuth(req, res);
//   if (!payload) return; // verifyAuth ya respondió con 401

const jwt = require("jsonwebtoken");
const { pool } = require("../server/db.js");

const COOKIE_NAME = "admin_token";
const TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2h — techo duro de vida del token
const ROTATE_THRESHOLD_SECONDS = 30 * 60; // reemitir si quedan <30min
const ISSUER = "vertex-tech-admin";
const AUDIENCE = "vertex-tech-admin-panel";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado");
  return secret;
}

// Vercel parsea req.cookies automáticamente en producción, pero el shim de
// dev-api-plugin.mjs no lo replica — parseamos el header a mano para que
// se comporte igual en los dos entornos.
function parseCookies(req) {
  const header = req.headers?.cookie;
  if (!header) return {};
  const out = {};
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(
      pair.slice(idx + 1).trim(),
    );
  }
  return out;
}

function signSessionToken({ id, username, sessionVersion }) {
  return jwt.sign(
    { userId: id, username, sv: sessionVersion },
    getJwtSecret(),
    {
      expiresIn: TOKEN_TTL_SECONDS,
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: "HS256",
    },
  );
}

function cookieAttributes(maxAgeSeconds) {
  // Secure requiere HTTPS: en dev local (http://localhost) el navegador
  // descartaría la cookie si la marcamos Secure, rompiendo el login.
  const isProd =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const parts = [
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd) parts.push("Secure");
  return parts;
}

function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    [`${COOKIE_NAME}=${token}`, ...cookieAttributes(TOKEN_TTL_SECONDS)].join(
      "; ",
    ),
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    [`${COOKIE_NAME}=`, ...cookieAttributes(0)].join("; "),
  );
}

async function verifyAuth(req, res) {
  const token = parseCookies(req)[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch {
    res.status(401).json({ error: "Sesión inválida o expirada" });
    return null;
  }

  // Revocación server-side: si session_version en la DB ya no coincide con
  // la que llevaba el token al firmarse, la sesión fue invalidada (logout,
  // cambio de contraseña) aunque el JWT en sí no haya expirado todavía.
  let currentVersion;
  try {
    const result = await pool.query(
      "SELECT session_version FROM admin_users WHERE id = $1 LIMIT 1",
      [payload.userId],
    );
    if (result.rows.length === 0) {
      res.status(401).json({ error: "Sesión inválida" });
      return null;
    }
    currentVersion = result.rows[0].session_version;
  } catch (err) {
    console.error("[auth] error verificando session_version:", err);
    res.status(500).json({ error: "Error interno del servidor" });
    return null;
  }

  if (payload.sv !== currentVersion) {
    res.status(401).json({ error: "Sesión revocada" });
    return null;
  }

  // Rotación: si al token le queda poco tiempo de vida, se reemite uno
  // nuevo para no cortar una sesión activa. Una sesión inactiva (o un
  // token robado que nadie usa) sigue expirando duro a las TOKEN_TTL_SECONDS
  // de su última emisión, en vez de vivir para siempre.
  const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
  if (secondsLeft < ROTATE_THRESHOLD_SECONDS) {
    const fresh = signSessionToken({
      id: payload.userId,
      username: payload.username,
      sessionVersion: currentVersion,
    });
    setSessionCookie(res, fresh);
  }

  return payload;
}

module.exports = {
  verifyAuth,
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
  parseCookies,
  getJwtSecret,
  COOKIE_NAME,
  ISSUER,
  AUDIENCE,
};
