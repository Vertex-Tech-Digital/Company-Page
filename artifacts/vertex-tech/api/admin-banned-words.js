// GET    /api/admin-banned-words        → lista todas las palabras prohibidas
// POST   /api/admin-banned-words        → agrega una palabra nueva
// DELETE /api/admin-banned-words?id=3  → elimina una palabra por id
//
// Requiere: Authorization: Bearer <token>

const { pool } = require("../server/db.js");
const { verifyAuth } = require("./_auth");

module.exports = async function handler(req, res) {
  const payload = verifyAuth(req, res);
  if (!payload) return;

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  try {
    // ── GET: listar todas las palabras ──────────────────────────────────────
    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT id, word, created_at FROM banned_words ORDER BY word ASC"
      );
      return res.status(200).json({ bannedWords: result.rows });
    }

    // ── POST: agregar palabra ───────────────────────────────────────────────
    if (req.method === "POST") {
      const { word } = req.body ?? {};

      if (!word || typeof word !== "string" || word.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "La palabra debe tener al menos 2 caracteres" });
      }

      const normalized = word.trim().toLowerCase();

      const result = await pool.query(
        `INSERT INTO banned_words (word)
         VALUES ($1)
         ON CONFLICT (word) DO NOTHING
         RETURNING id, word`,
        [normalized]
      );

      if (result.rows.length === 0) {
        return res.status(409).json({ error: "Esa palabra ya existe en la lista" });
      }

      return res.status(201).json({ success: true, bannedWord: result.rows[0] });
    }

    // ── DELETE: eliminar palabra ────────────────────────────────────────────
    if (req.method === "DELETE") {
      const id = parseInt(req.query?.id, 10);
      if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const result = await pool.query(
        "DELETE FROM banned_words WHERE id = $1 RETURNING id, word",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Palabra no encontrada" });
      }

      return res.status(200).json({ success: true, deleted: result.rows[0] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Error en admin-banned-words:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
