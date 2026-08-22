// POST /api/admin-login
// Autentica al administrador (Anier) y abre sesión.
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

const { pool } = require("../server/db.js");
const bcrypt = require("bcryptjs");
const { signSessionToken, setSessionCookie } = require("./_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
    // contraseña es incorrecta — no damos pistas sobre cuál falló
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
