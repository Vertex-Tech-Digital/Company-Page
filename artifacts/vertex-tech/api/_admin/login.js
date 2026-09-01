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

const bcrypt = require("bcryptjs");
const { pool } = require("../../server/db.js");
const { signSessionToken, setSessionCookie } = require("../_auth");
const { createRateLimiter, getClientIp } = require("../_rate-limit.js");

// 5 intentos cada 10 min por IP: frena fuerza bruta/credential stuffing sin
// bloquear a un admin real que se equivoca de contraseña una o dos veces.
const isRateLimited = createRateLimiter({
  prefix: "admin-login",
  count: 5,
  window: "10 m",
});

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp = getClientIp(req);
  if (await isRateLimited(clientIp)) {
    return res
      .status(429)
      .json({ error: "Demasiados intentos. Inténtalo de nuevo más tarde." });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const { username, password } = req.body ?? {};

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Usuario requerido" });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Contraseña requerida" });
  }

  try {
    // Buscar el usuario en la base de datos
    const result = await pool.query(
      "SELECT id, username, password_hash, session_version FROM admin_users WHERE username = $1 LIMIT 1",
      [username.toLowerCase().trim()],
    );

    // Respuesta genérica tanto si el usuario no existe como si la
    // contraseña es incorrecta — no damos pistas sobre cuál falló.
    // bcrypt.compare ya es en sí mismo resistente a timing attacks: su
    // costo depende del salt/rounds embebidos en el hash, no de en qué
    // carácter difiere la comparación.
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = signSessionToken({
      id: user.id,
      username: user.username,
      sessionVersion: user.session_version,
    });
    setSessionCookie(res, token);

    return res.status(200).json({ success: true, username: user.username });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
