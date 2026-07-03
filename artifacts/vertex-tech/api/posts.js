// GET /api/posts
// Lista posts públicos (aprobados). Soporta filtro por categoría:
//   GET /api/posts                     → todos los posts
//   GET /api/posts?category=qa-testing → solo los de esa categoría (por slug)
// No requiere autenticación — es información pública.

const { Pool } = require("pg");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const categorySlug = req.query?.category ?? null;

  try {
    let query;
    let params;

    if (categorySlug) {
      // Filtra por slug de categoría
      query = `
        SELECT
          p.id, p.slug, p.title, p.excerpt, p.image_url,
          p.created_at,
          c.id   AS category_id,
          c.name AS category_name,
          c.slug AS category_slug
        FROM posts p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE c.slug = $1
        ORDER BY p.created_at DESC
      `;
      params = [categorySlug];
    } else {
      // Todos los posts
      query = `
        SELECT
          p.id, p.slug, p.title, p.excerpt, p.image_url,
          p.created_at,
          c.id   AS category_id,
          c.name AS category_name,
          c.slug AS category_slug
        FROM posts p
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY p.created_at DESC
      `;
      params = [];
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ posts: result.rows });
  } catch (err) {
    console.error("Error al obtener posts:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await pool.end();
  }
};
