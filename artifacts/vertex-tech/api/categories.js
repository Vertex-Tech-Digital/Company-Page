// GET /api/categories
// Devuelve todas las categorías del blog ordenadas por nombre.
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

  try {
    const result = await pool.query(
      "SELECT id, slug, name FROM categories ORDER BY name ASC"
    );
    return res.status(200).json({ categories: result.rows });
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    await pool.end();
  }
};
