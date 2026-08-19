import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Globe,
  FileEdit,
  ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { parseTiptapContent } from "@/lib/tiptap-content";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
  category_id: number | null;
  category_name: string | null;
}

interface Category {
  id: number;
  slug: string;
  name: string;
}

interface AdminPostsProps {
  token: string;
}

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content: null as object | null,  // TipTap JSON; null = editor vacío
  imageUrl: "",
  categoryId: "",
  // Traducción al inglés (opcional) — si se deja vacía, el sitio muestra
  // el contenido en español como fallback cuando el visitante elige "en".
  titleEn: "",
  excerptEn: "",
  contentEn: null as object | null,
};

// ── Slug preview en tiempo real ────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Componente principal ───────────────────────────────────────────────────────

export function AdminPosts({ token }: AdminPostsProps) {
  const [, setLocation] = useLocation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "form">("list");

  // Ref para el ID del post en edición — nunca pierde su valor entre renders
  // aunque el estado de React se actualice en lote.
  const editingIdRef = useRef<number | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Carga de datos ─────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts);
    } catch {
      setError("No se pudieron cargar los posts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data.categories);
    } catch {
      console.error("No se pudieron cargar las categorías");
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  // ── Navegación entre vistas ────────────────────────────────────────────────

  function openCreateForm() {
    editingIdRef.current = null;
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setView("form");
  }

  async function openEditForm(post: Post) {
    // Guardamos el ID en el ref ANTES de cambiar de vista —
    // así handleSave siempre lo puede leer aunque el estado tarde en actualizarse.
    editingIdRef.current = post.id;
    setEditingPost(post);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: null,     // se carga del servidor a continuación
      imageUrl: post.image_url ?? "",
      categoryId: post.category_id?.toString() ?? "",
      titleEn: "",
      excerptEn: "",
      contentEn: null,   // se carga del servidor a continuación
    });
    setFormError(null);
    setView("form");

    // Cargar el contenido completo del post vía /api/post?slug=
    // (el GET /admin-posts solo devuelve metadatos, no el content completo)
    setContentLoading(true);
    try {
      const res = await fetch(`/api/admin-posts?slug=${encodeURIComponent(post.slug)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw = data.post?.content ?? "";
      // Convierte tanto JSON de TipTap como texto plano heredado a un
      // documento TipTap válido (misma lógica que RichTextRenderer, para
      // que lo que se ve en /blog sea lo mismo que se carga en el editor).
      const parsed = parseTiptapContent(raw);
      const rawEn = data.post?.content_en ?? "";
      const parsedEn = rawEn ? parseTiptapContent(rawEn) : null;
      setForm((f) => ({
        ...f,
        content: parsed,
        titleEn: data.post?.title_en ?? "",
        excerptEn: data.post?.excerpt_en ?? "",
        contentEn: parsedEn,
      }));
    } catch {
      // Si el post es draft /api/post devuelve 404 (solo muestra publicados).
      // En ese caso el campo content queda vacío — el admin puede re-introducirlo.
      // Se muestra un aviso informativo pero no se bloquea el formulario.
      setFormError(
        "No se pudo cargar el contenido del artículo (puede ser un borrador no publicado). " +
        "Puedes escribirlo de nuevo aquí — los demás campos ya están cargados."
      );
    } finally {
      setContentLoading(false);
    }
  }

  function backToList() {
    editingIdRef.current = null;
    setView("list");
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  // ── Guardar post (crear o editar) ──────────────────────────────────────────

  async function handleSave() {
    setFormError(null);

    // Leemos el ID desde el ref — siempre tiene el valor correcto
    const currentEditingId = editingIdRef.current;
    const isEditing = currentEditingId !== null;

    if (!form.title.trim() || form.title.trim().length < 3) {
      setFormError("El título debe tener al menos 3 caracteres");
      return;
    }
    if (!form.excerpt.trim()) {
      setFormError("El resumen (excerpt) es obligatorio");
      return;
    }
    if (!isEditing && !form.content) {
      setFormError("El contenido es obligatorio para crear un nuevo post");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        imageUrl: form.imageUrl.trim() || null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        // Traducción al inglés — opcional, se puede dejar vacía o borrarse.
        titleEn: form.titleEn.trim() || null,
        excerptEn: form.excerptEn.trim() || null,
        contentEn: form.contentEn ? JSON.stringify(form.contentEn) : null,
      };
      if (form.content) body.content = JSON.stringify(form.content);

      let res: Response;

      if (isEditing) {
        res = await fetch(`/api/admin-posts?id=${currentEditingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin-posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar el post");
        return;
      }

      await fetchPosts();
      setSuccessMsg(isEditing ? "Post actualizado correctamente" : "Post creado como borrador");
      setTimeout(() => setSuccessMsg(null), 3000);
      backToList();
    } catch {
      setFormError("Error de red al guardar el post");
    } finally {
      setSaving(false);
    }
  }

  // ── Publicar / despublicar ─────────────────────────────────────────────────

  async function handleToggleStatus(post: Post) {
    const newStatus = post.status === "draft" ? "published" : "draft";
    try {
      const res = await fetch(`/api/admin-posts?id=${post.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
      );
    } catch {
      setError("Error al cambiar el estado del post");
    }
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────

  async function handleDelete(post: Post) {
    if (
      !window.confirm(
        `¿Eliminar el post "${post.title}"? Esta acción no se puede deshacer.`
      )
    )
      return;

    setDeletingId(post.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin-posts?id=${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      setError("Error al eliminar el post");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ── Estado: cargando lista ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Cargando posts...
      </div>
    );
  }

  // ── Vista: formulario crear / editar ───────────────────────────────────────

  if (view === "form") {
    const slugPreview = slugify(form.title) || "—";
    const isEditing = editingIdRef.current !== null;

    return (
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button
            onClick={backToList}
            className="text-muted-foreground hover:text-white transition-colors"
            title="Volver a la lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? `Editando: ${editingPost?.title ?? ""}` : "Nuevo post"}
            </h2>
          </div>
        </div>

        {/* Error del formulario */}
        {formError && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título del artículo"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <p className="text-xs text-muted-foreground">
              Slug:{" "}
              <span className="font-mono text-primary/80">{slugPreview}</span>
            </p>
          </div>

          {/* Resumen */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Resumen (excerpt) *
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Breve descripción del artículo para la tarjeta del blog"
              rows={2}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Contenido — editor TipTap */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isEditing
                ? "Contenido (dejar vacío para conservar el actual)"
                : "Contenido *"}
            </label>
            {contentLoading ? (
              <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cargando contenido...
              </div>
            ) : (
              <RichTextEditor
                value={form.content}
                onChange={(json) => setForm((f) => ({ ...f, content: json }))}
                disabled={saving}
              />
            )}
          </div>

          {/* Imagen y categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                URL de imagen de portada
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Categoría
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Traducción al inglés (opcional) ──────────────────────────── */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white">
                Traducción al inglés (opcional)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Si se deja vacío, los visitantes que elijan inglés verán el
              contenido en español como respaldo.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Título (EN)
              </label>
              <input
                type="text"
                value={form.titleEn}
                onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
                placeholder="Article title"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Resumen (EN)
              </label>
              <textarea
                value={form.excerptEn}
                onChange={(e) => setForm((f) => ({ ...f, excerptEn: e.target.value }))}
                placeholder="Short description for the blog card"
                rows={2}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Contenido (EN)
              </label>
              {contentLoading ? (
                <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cargando contenido...
                </div>
              ) : (
                <RichTextEditor
                  value={form.contentEn}
                  onChange={(json) => setForm((f) => ({ ...f, contentEn: json }))}
                  placeholder="Write the article content in English here..."
                  disabled={saving}
                />
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving || contentLoading}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {saving
              ? "Guardando..."
              : isEditing
              ? "Guardar cambios"
              : "Crear borrador"}
          </Button>
          <Button
            onClick={backToList}
            disabled={saving}
            variant="outline"
            className="border-border text-muted-foreground hover:text-white"
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // ── Vista: lista de posts ──────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Posts</h2>
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
            {posts.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPosts}
            className="text-muted-foreground hover:text-white transition-colors"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            onClick={openCreateForm}
            className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs h-8 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo post
          </Button>
        </div>
      </div>

      {/* Mensaje de éxito temporal */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Sin posts */}
      {posts.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay posts todavía</p>
          <p className="text-xs mt-1">Crea el primero con el botón "Nuevo post"</p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="rounded-xl border border-border bg-card/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              {/* Info del post */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Título como enlace — abre /blog/:slug en pestaña nueva */}
                  <button
                    onClick={() => setLocation(`/blog/${post.slug}`)}
                    className="text-sm font-medium text-white hover:text-primary transition-colors text-left truncate flex items-center gap-1.5"
                    title={`Ver: /blog/${post.slug}`}
                  >
                    {post.title}
                    {post.status === "published" && (
                      <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
                    )}
                  </button>

                  {/* Badge de estado */}
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${
                      post.status === "published"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}
                  >
                    {post.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-mono">/blog/{post.slug}</span>
                  {post.category_name && (
                    <>
                      <span>·</span>
                      <span>{post.category_name}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDate(post.updated_at)}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Publicar / despublicar */}
                <button
                  onClick={() => handleToggleStatus(post)}
                  title={post.status === "published" ? "Volver a borrador" : "Publicar"}
                  className={`p-1.5 rounded-lg transition-colors ${
                    post.status === "published"
                      ? "text-green-400 hover:bg-green-400/10"
                      : "text-muted-foreground hover:text-green-400 hover:bg-green-400/10"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                </button>

                {/* Editar */}
                <button
                  onClick={() => openEditForm(post)}
                  title="Editar"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Eliminar */}
                <button
                  onClick={() => handleDelete(post)}
                  disabled={deletingId === post.id}
                  title="Eliminar"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
