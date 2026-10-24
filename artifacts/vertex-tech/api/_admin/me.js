// GET /api/admin-me
// Comprueba si la cookie de sesión actual es válida. El frontend la usa al
// cargar /admin para saber si ya hay una sesión activa — como el token vive
// en una cookie httpOnly, JS no puede leerlo directamente (ver Admin.tsx).

const { verifyAuth } = require("../_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = await verifyAuth(req, res);
  if (!payload) return; // verifyAuth ya respondió 401

  return res.status(200).json({ username: payload.username });
};
