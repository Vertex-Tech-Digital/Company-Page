// POST /api/admin-login
// Autentica al administrador y abre sesión.
//
// ⚠️ MODO TEMPORAL — pedido explícito para hoy: la contraseña se compara
// contra la variable de entorno ADMIN_PASSWORD (Vercel → Settings →
// Environment Variables), no contra el hash bcrypt de la base de datos.
// Esto es un paso atrás en seguridad respecto al modelo con `admin_users`
// (un env var en texto plano es más expuesto que un hash, y rotarlo exige
// redeploy) — queda así por decisión explícita, PENDIENTE DE REVERTIR a
// autenticar contra `admin_users.password_hash` vía `lib/db/seed.ts`
// (que ya quedó preparado para eso: ADMIN_USERNAME/ADMIN_PASSWORD como
// argumentos del seed, no como env vars permanentes de la app).
//
// La fila en `admin_users` se sigue usando para `id`/`session_version`
// (revocación, rotación de sesión) — eso no cambió.
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

// Nombre distinto al global `crypto` (Web Crypto API, disponible sin
// require desde Node 19+) — este módulo necesita createHash/timingSafeEqual,
// que solo existen en el módulo `crypto` de Node, no en el global.
const nodeCrypto = require("crypto");
const bcrypt = require("bcryptjs");
const { pool } = require("../server/db.js");
const { signSessionToken, setSessionCookie } = require("./_auth");

// Comparación en tiempo constante: un `===` normal sale antes en cuanto
// encuentra el primer carácter distinto, y esa diferencia de tiempo es
// medible y explotable para adivinar la contraseña carácter a carácter.
// Se compara el hash SHA-256 de ambos strings (largo fijo de 32 bytes) en
// vez de los strings crudos, para no filtrar tampoco la longitud.
function timingSafeStringsEqual(a, b) {
  const hashA = nodeCrypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = nodeCrypto.createHash("sha256").update(b, "utf8").digest();
  return nodeCrypto.timingSafeEqual(hashA, hashB);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword) {
    console.error("ADMIN_USERNAME/ADMIN_PASSWORD no configuradas");
    return res.status(500).json({ error: "Login no configurado" });
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

  // Respuesta genérica tanto si el usuario no existe como si la contraseña
  // es incorrecta — no damos pistas sobre cuál falló.
  const usernameValid = timingSafeStringsEqual(
    username.toLowerCase().trim(),
    adminUsername.toLowerCase().trim(),
  );
  const passwordValid = timingSafeStringsEqual(password, adminPassword);
  if (!usernameValid || !passwordValid) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const normalizedUsername = adminUsername.toLowerCase().trim();

  try {
    // La identidad de sesión (id, session_version) sigue viviendo en
    // admin_users, aunque la contraseña ya no se valide contra esa fila.
    // Si todavía no existe (primer login en este modo), se crea con un
    // password_hash inservible a propósito: en este modo nunca se lee.
    let result = await pool.query(
      "SELECT id, session_version FROM admin_users WHERE username = $1 LIMIT 1",
      [normalizedUsername],
    );

    if (result.rows.length === 0) {
      const placeholderHash = await bcrypt.hash(nodeCrypto.randomUUID(), 10);
      result = await pool.query(
        `INSERT INTO admin_users (username, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
         RETURNING id, session_version`,
        [normalizedUsername, placeholderHash],
      );
    }

    const user = result.rows[0];

    const token = signSessionToken({
      id: user.id,
      username: normalizedUsername,
      sessionVersion: user.session_version,
    });
    setSessionCookie(res, token);

    return res
      .status(200)
      .json({ success: true, username: normalizedUsername });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
