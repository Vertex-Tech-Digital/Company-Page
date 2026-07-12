// POST /api/comments
// Recibe un comentario nuevo, aplica el filtro de palabras prohibidas,
// y lo guarda con estado "pending" para que Anier lo modere.
//
// Body esperado:
// {
//   "postId": 1,
//   "authorName": "Juan",
//   "authorEmail": "juan@ejemplo.com",
//   "content": "Gran artículo, muy útil."
// }

const { pool } = require("../server/db.js");

// ─── Validación básica ───────────────────────────────────────────────────────

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

// ─── Filtro de palabras prohibidas ──────────────────────────────────────────

async function checkBannedWords(pool, text) {
  const result = await pool.query("SELECT word FROM banned_words");
  const bannedWords = result.rows.map((r) => r.word.toLowerCase());

  const normalizedText = text.toLowerCase();

  const found = bannedWords.filter((word) => normalizedText.includes(word));
  return {
    flagged: found.length > 0,
    matches: found,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const { postId, authorName, authorEmail, content } = req.body ?? {};

  // Validaciones
  if (!postId || typeof postId !== "number") {
    return res.status(400).json({ error: "postId inválido" });
  }
  if (!authorName || typeof authorName !== "string" || authorName.trim().length < 2) {
    return res.status(400).json({ error: "El nombre es requerido (mínimo 2 caracteres)" });
  }
  if (!isValidEmail(authorEmail)) {
    return res.status(400).json({ error: "El email no es válido" });
  }
  if (!content || typeof content !== "string" || content.trim().length < 5) {
    return res.status(400).json({ error: "El comentario es requerido (mínimo 5 caracteres)" });
  }
  if (content.trim().length > 2000) {
    return res.status(400).json({ error: "El comentario no puede superar los 2000 caracteres" });
  }

  try {
    // Verificar que el post existe
    const postResult = await pool.query(
      "SELECT id FROM posts WHERE id = $1 LIMIT 1",
      [postId]
    );
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "El post no existe" });
    }

    // Aplicar filtro de palabras prohibidas
    const { flagged, matches } = await checkBannedWords(pool, content);

    // Insertar comentario con estado "pending" siempre
    // (incluso los flagged pasan a moderación, Anier decide)
    const insertResult = await pool.query(
      `INSERT INTO comments (post_id, author_name, author_email, content, status, flagged)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id`,
      [
        postId,
        authorName.trim(),
        authorEmail.trim().toLowerCase(),
        content.trim(),
        flagged,
      ]
    );

    const commentId = insertResult.rows[0].id;

    // Respuesta al usuario — no le decimos si fue flagged
    // para no dar pistas a quienes intentan saltarse el filtro
    return res.status(201).json({
      success: true,
      commentId,
      message:
        "Tu comentario ha sido recibido y está pendiente de moderación. Aparecerá en breve si es aprobado.",
    });
  } catch (err) {
    console.error("Error al guardar comentario:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
