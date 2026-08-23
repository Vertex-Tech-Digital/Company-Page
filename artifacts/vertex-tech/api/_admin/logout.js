// POST /api/admin-logout
// Cierra la sesión: revoca el token server-side (incrementa session_version,
// invalidando también cualquier otra sesión activa emitida antes de este
// logout) y limpia la cookie.
//
// Es tolerante a tokens ya expirados/ausentes — un logout nunca debe fallar
// solo porque la sesión ya no era válida.

const jwt = require("jsonwebtoken");
const { pool } = require("../../server/db.js");
const {
  parseCookies,
  getJwtSecret,
  clearSessionCookie,
  COOKIE_NAME,
  ISSUER,
  AUDIENCE,
} = require("../_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = parseCookies(req)[COOKIE_NAME];

  if (token && process.env.DATABASE_URL) {
    try {
      // ignoreExpiration: un token ya expirado igual identifica de forma
      // confiable (está firmado) a qué usuario pertenece la sesión a revocar.
      const payload = jwt.verify(token, getJwtSecret(), {
        algorithms: ["HS256"],
        issuer: ISSUER,
        audience: AUDIENCE,
        ignoreExpiration: true,
      });
      await pool.query(
        "UPDATE admin_users SET session_version = session_version + 1 WHERE id = $1",
        [payload.userId],
      );
    } catch (err) {
      // Token corrupto o con firma inválida: no hay nada que revocar
      // server-side, pero igual limpiamos la cookie del navegador.
      console.error(
        "[admin-logout] no se pudo revocar la sesión:",
        err.message,
      );
    }
  }

  clearSessionCookie(res);
  return res.status(200).json({ success: true });
};
