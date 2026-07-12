// GET /api/post?slug=mi-articulo
// Devuelve un post específico por su slug, incluyendo su categoría.
// No requiere autenticación — es información pública.
// Solo devuelve el post si status = 'published'; un draft responde 404,
// igual que si no existiera (evita filtrar cuáles slugs son drafts).

const { pool } = require("../server/db.js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const slug = req.query?.slug;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "El parámetro 'slug' es requerido" });
  }

  try {
    const result = await pool.query(
      `SELECT
         p.id, p.slug, p.title, p.excerpt, p.content, p.image_url,
         p.created_at, p.updated_at,
         c.id   AS category_id,
         c.name AS category_name,
         c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND p.status = 'published'
       LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post no encontrado" });
    }

    return res.status(200).json({ post: result.rows[0] });
  } catch (err) {
    console.error("Error al obtener post:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
