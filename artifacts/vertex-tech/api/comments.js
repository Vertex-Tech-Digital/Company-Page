// POST /api/comments
// Recibe un comentario nuevo, aplica el filtro de palabras prohibidas,
// y lo guarda con estado "pending" para que el administrador lo modere.

const { pool } = require("../server/db.js");
const {
  enforceBodyLimit,
  commentPreSchema,
  commentPostSchema,
  normalizeCommentInput,
  formatZodError,
} = require("./_validation");

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

  // 1. Límite de tamaño del body
  if (!enforceBodyLimit(req, res)) return;

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  // 2. Validación pre-normalización (tipos y límites crudos)
  const preResult = commentPreSchema.safeParse(req.body ?? {});
  if (!preResult.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: formatZodError(preResult.error),
    });
  }

  // 3. Normalización y saneamiento
  const normalized = normalizeCommentInput(preResult.data);

  // 4. Validación post-normalización (email válido, longitud de contenido tras saneamiento)
  const postResult = commentPostSchema.safeParse(normalized);
  if (!postResult.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      details: formatZodError(postResult.error),
    });
  }

  const { postId, authorName, authorEmail, content } = postResult.data;

  try {
    // Verificar que el post existe
    const postResultDb = await pool.query(
      "SELECT id FROM posts WHERE id = $1 LIMIT 1",
      [postId],
    );
    if (postResultDb.rows.length === 0) {
      return res.status(404).json({ error: "El post no existe" });
    }

    // Aplicar filtro de palabras prohibidas
    const { flagged } = await checkBannedWords(pool, content);

    // Insertar comentario con estado "pending" siempre
    const insertResult = await pool.query(
      `INSERT INTO comments (post_id, author_name, author_email, content, status, flagged)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id`,
      [postId, authorName, authorEmail, content, flagged],
    );

    const commentId = insertResult.rows[0].id;

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
