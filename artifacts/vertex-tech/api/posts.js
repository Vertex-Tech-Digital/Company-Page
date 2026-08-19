// GET /api/posts
// Lista posts públicos (aprobados). Soporta filtro por categoría:
//   GET /api/posts                     → todos los posts publicados
//   GET /api/posts?category=qa-testing → solo los de esa categoría (por slug)
// No requiere autenticación — es información pública.
// Solo devuelve posts con status = 'published'; los drafts nunca se exponen aquí.

const { pool } = require("../server/db.js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const categorySlug = req.query?.category ?? null;

  try {
    let query;
    let params;

    if (categorySlug) {
      // Filtra por slug de categoría
      query = `
        SELECT
          p.id, p.slug, p.title, p.excerpt, p.image_url,
          p.title_en, p.excerpt_en,
          p.created_at,
          c.id   AS category_id,
          c.name AS category_name,
          c.slug AS category_slug
        FROM posts p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'published' AND c.slug = $1
        ORDER BY p.created_at DESC
      `;
      params = [categorySlug];
    } else {
      // Todos los posts publicados
      query = `
        SELECT
          p.id, p.slug, p.title, p.excerpt, p.image_url,
          p.title_en, p.excerpt_en,
          p.created_at,
          c.id   AS category_id,
          c.name AS category_name,
          c.slug AS category_slug
        FROM posts p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ posts: result.rows });
  } catch (err) {
    console.error("Error al obtener posts:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
