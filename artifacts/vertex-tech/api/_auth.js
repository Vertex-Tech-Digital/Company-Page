// _auth.js — helper compartido para verificar el JWT en rutas protegidas.
// El prefijo _ hace que Vercel NO lo exponga como ruta pública.
//
// Uso en una ruta protegida:
//   const { verifyAuth } = require("./_auth");
//   const payload = verifyAuth(req, res);
//   if (!payload) return; // verifyAuth ya respondió con 401

const jwt = require("jsonwebtoken");

// Impide que las respuestas administrativas (NIF, razón social, facturas,
// importes) queden almacenadas en el navegador o en cualquier proxy/CDN
// intermedio, desde donde podrían servirse a otro usuario.
//
// - no-store: no guardar la respuesta en ningún caché, ni en disco ni en RAM.
// - no-cache / must-revalidate: revalidar siempre contra el origen.
// - private: refuerza que ningún caché compartido (proxy, CDN) la guarde.
// - Pragma/Expires: equivalentes en HTTP/1.0, para proxies antiguos que
//   ignoran Cache-Control.
function setNoStoreHeaders(res) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function verifyAuth(req, res) {
  // Se aplican antes de cualquier return: tanto la respuesta con datos como
  // los 401 de credenciales inválidas salen con las cabeceras puestas.
  setNoStoreHeaders(res);

  const authHeader = req.headers?.authorization ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token no proporcionado" });
    return null;
  }

  const token = authHeader.slice(7); // quita el "Bearer "

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no configurado");
    const payload = jwt.verify(token, secret);
    return payload;
  } catch (err) {
    res.status(401).json({ error: "Token inválido o expirado" });
    return null;
  }
}

module.exports = { verifyAuth, setNoStoreHeaders };
