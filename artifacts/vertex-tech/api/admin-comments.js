// GET  /api/admin-comments              → lista comentarios pendientes
// PATCH /api/admin-comments?id=5        → aprueba o rechaza un comentario
//
// Body del PATCH:
// { "status": "approved" }  o  { "status": "rejected" }
//
// Requiere: Authorization: Bearer <token>

const { Pool } = require("pg");
const { verifyAuth } = require("./_auth");

module.exports = async function handler(req, res) {
  // Verificar autenticación en todos los métodos
  const payload = verifyAuth(req, res);
  if (!payload) return;

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // ── GET: listar comentarios pendientes ──────────────────────────────────
    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT
           c.id, c.author_name, c.author_email, c.content,
           c.status, c.flagged, c.created_at,
           p.title AS post_title, p.slug AS post_slug
         FROM comments c
         JOIN posts p ON p.id = c.post_id
         WHERE c.status = 'pending'
         ORDER BY c.flagged DESC, c.created_at ASC`
      );
      // Los flagged aparecen primero para que Anier los revise con más cuidado
      return res.status(200).json({ comments: result.rows });
    }

    // ── PATCH: aprobar o rechazar ───────────────────────────────────────────
    if (req.method === "PATCH") {
      const id = parseInt(req.query?.id, 10);
      if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID de comentario inválido" });
      }

      const { status } = req.body ?? {};
      if (status !== "approved" && status !== "rejected") {
        return res
          .status(400)
          .json({ error: "El status debe ser 'approved' o 'rejected'" });
      }

      const result = await pool.query(
        `UPDATE comments SET status = $1 WHERE id = $2 RETURNING id, status`,
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Comentario no encontrado" });
      }

      return res.status(200).json({
        success: true,
        comment: result.rows[0],
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Error en admin-comments:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await pool.end();
  }
};
