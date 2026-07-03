// _auth.js — helper compartido para verificar el JWT en rutas protegidas.
// El prefijo _ hace que Vercel NO lo exponga como ruta pública.
//
// Uso en una ruta protegida:
//   const { verifyAuth } = require("./_auth");
//   const payload = verifyAuth(req, res);
//   if (!payload) return; // verifyAuth ya respondió con 401

const jwt = require("jsonwebtoken");

function verifyAuth(req, res) {
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

module.exports = { verifyAuth };
