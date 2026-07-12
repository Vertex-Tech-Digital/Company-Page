// GET    /api/admin-posts              → lista todos los posts (draft y published)
// POST   /api/admin-posts               → crea un post nuevo (status inicial: draft)
// PATCH  /api/admin-posts?id=5          → edita un post (título, contenido, status, etc.)
// DELETE /api/admin-posts?id=5          → elimina un post
//
// Body del POST:
// { "title": "...", "excerpt": "...", "content": "...", "imageUrl": "...", "categoryId": 1 }
// El slug se genera automáticamente a partir del título (ver slugify más abajo).
//
// Body del PATCH (todos los campos son opcionales, solo se actualiza lo enviado):
// { "title": "...", "excerpt": "...", "content": "...", "imageUrl": "...",
//   "categoryId": 1, "status": "draft" | "published" }
//
// Requiere: Authorization: Bearer <token>

const { pool } = require("../server/db.js");
const { verifyAuth } = require("./_auth");

// Convierte un título en un slug URL-friendly:
//   "Mi Primer Artículo!" -> "mi-primer-articulo"
function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos (á -> a)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // quita caracteres especiales
    .replace(/\s+/g, "-") // espacios -> guiones
    .replace(/-+/g, "-") // colapsa guiones repetidos
    .replace(/^-|-$/g, ""); // quita guiones al inicio/final
}

// Genera un slug único consultando la base de datos. Si "mi-articulo" ya
// existe, prueba "mi-articulo-2", "mi-articulo-3", etc.
async function generateUniqueSlug(pool, baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const query = excludeId
      ? "SELECT id FROM posts WHERE slug = $1 AND id != $2"
      : "SELECT id FROM posts WHERE slug = $1";
    const params = excludeId ? [slug, excludeId] : [slug];

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

module.exports = async function handler(req, res) {
  // Verificar autenticación en todos los métodos
  const payload = verifyAuth(req, res);
  if (!payload) return;

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Base de datos no configurada" });
  }

  try {
    // ── GET ────────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const slug = req.query?.slug;

      // GET ?slug=mi-articulo → post completo (draft o published) para el editor
      if (slug) {
        const result = await pool.query(
          `SELECT
             p.id, p.slug, p.title, p.excerpt, p.content, p.image_url, p.status,
             p.created_at, p.updated_at,
             c.id   AS category_id,
             c.name AS category_name,
             c.slug AS category_slug
           FROM posts p
           LEFT JOIN categories c ON c.id = p.category_id
           WHERE p.slug = $1
           LIMIT 1`,
          [slug]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Post no encontrado" });
        }
        return res.status(200).json({ post: result.rows[0] });
      }

      // GET (sin parámetros) → lista todos los posts para el panel admin
      const result = await pool.query(
        `SELECT
           p.id, p.slug, p.title, p.excerpt, p.image_url, p.status,
           p.created_at, p.updated_at,
           c.id   AS category_id,
           c.name AS category_name,
           c.slug AS category_slug
         FROM posts p
         LEFT JOIN categories c ON c.id = p.category_id
         ORDER BY p.updated_at DESC`
      );
      return res.status(200).json({ posts: result.rows });
    }

    // ── POST: crear un post nuevo ────────────────────────────────────────────
    if (req.method === "POST") {
      const { title, excerpt, content, imageUrl, categoryId } = req.body ?? {};

      if (!title || typeof title !== "string" || title.trim().length < 3) {
        return res
          .status(400)
          .json({ error: "El título debe tener al menos 3 caracteres" });
      }
      if (!excerpt || typeof excerpt !== "string") {
        return res.status(400).json({ error: "El resumen (excerpt) es requerido" });
      }
      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "El contenido es requerido" });
      }

      const baseSlug = slugify(title);
      if (!baseSlug) {
        return res
          .status(400)
          .json({ error: "No se pudo generar un slug válido a partir del título" });
      }
      const slug = await generateUniqueSlug(pool, baseSlug);

      const result = await pool.query(
        `INSERT INTO posts (slug, title, excerpt, content, image_url, category_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'draft')
         RETURNING id, slug, title, excerpt, image_url, status, created_at, updated_at`,
        [slug, title.trim(), excerpt.trim(), content, imageUrl ?? null, categoryId ?? null]
      );

      return res.status(201).json({ success: true, post: result.rows[0] });
    }

    // ── PATCH: editar un post existente ─────────────────────────────────────
    if (req.method === "PATCH") {
      const id = parseInt(req.query?.id, 10);
      if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID de post inválido" });
      }

      const { title, excerpt, content, imageUrl, categoryId, status } = req.body ?? {};

      if (status !== undefined && status !== "draft" && status !== "published") {
        return res
          .status(400)
          .json({ error: "El status debe ser 'draft' o 'published'" });
      }

      // Construye el UPDATE dinámicamente según los campos enviados,
      // para no sobreescribir con NULL lo que el cliente no mandó.
      const fields = [];
      const values = [];
      let i = 1;

      if (title !== undefined) {
        fields.push(`title = $${i++}`);
        values.push(title.trim());

        // Si cambia el título, regeneramos el slug (excluyendo este mismo post
        // de la verificación de unicidad).
        const newSlug = await generateUniqueSlug(pool, slugify(title), id);
        fields.push(`slug = $${i++}`);
        values.push(newSlug);
      }
      if (excerpt !== undefined) {
        fields.push(`excerpt = $${i++}`);
        values.push(excerpt.trim());
      }
      if (content !== undefined) {
        fields.push(`content = $${i++}`);
        values.push(content);
      }
      if (imageUrl !== undefined) {
        fields.push(`image_url = $${i++}`);
        values.push(imageUrl);
      }
      if (categoryId !== undefined) {
        fields.push(`category_id = $${i++}`);
        values.push(categoryId);
      }
      if (status !== undefined) {
        // Postgres requiere un cast explícito al asignar un enum vía parámetro
        fields.push(`status = $${i++}::post_status`);
        values.push(status);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: "No se enviaron campos para actualizar" });
      }

      // Siempre actualiza updated_at
      fields.push(`updated_at = now()`);

      values.push(id);
      const result = await pool.query(
        `UPDATE posts SET ${fields.join(", ")} WHERE id = $${i} RETURNING
           id, slug, title, excerpt, image_url, status, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Post no encontrado" });
      }

      return res.status(200).json({ success: true, post: result.rows[0] });
    }

    // ── DELETE: eliminar un post ─────────────────────────────────────────────
    if (req.method === "DELETE") {
      const id = parseInt(req.query?.id, 10);
      if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const result = await pool.query(
        "DELETE FROM posts WHERE id = $1 RETURNING id, title",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Post no encontrado" });
      }

      return res.status(200).json({ success: true, deleted: result.rows[0] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Error en admin-posts:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
