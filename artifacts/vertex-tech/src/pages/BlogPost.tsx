import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Tag,
  Pencil,
} from "lucide-react";
import { PageNavbar } from "@/components/sections/PageNavbar";
import { Footer } from "@/components/sections/Footer";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { useLanguage } from "@/context/LanguageContext";

interface FullPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  category_slug: string | null;
}

function formatDate(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(
    lang === "es" ? "es-ES" : "en-US",
    { day: "2-digit", month: "long", year: "numeric" },
  );
}

export default function BlogPost() {
  const { lang } = useLanguage();
  const [, setLocation] = useLocation();

  // Wouter: extrae el slug de la URL /blog/:slug
  const [matched, params] = useRoute("/blog/:slug");
  const slug = matched ? params?.slug : null;

  const [post, setPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // La sesión admin vive en una cookie httpOnly, invisible a JS — le
  // preguntamos al servidor si hay una activa para decidir si mostrar el
  // botón de editar (puramente cosmético: /admin igual vuelve a validar).
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/admin-me", { credentials: "include" })
      .then((r) => setIsAdmin(r.ok))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    fetch(`/api/post?slug=${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) throw new Error("not_found");
        if (!r.ok) throw new Error("server_error");
        return r.json();
      })
      .then((data) => setPost(data.post))
      .catch((err) => {
        setError(err.message === "not_found" ? "not_found" : "server_error");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Estado: cargando ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen text-foreground font-sans">
        <PageNavbar />
        <div className="flex items-center justify-center py-40 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          {lang === "es" ? "Cargando artículo..." : "Loading article..."}
        </div>
        <Footer />
      </main>
    );
  }

  // ── Estado: error / no encontrado ────────────────────────────────────────────
  if (error || !post) {
    const isNotFound = error === "not_found";
    return (
      <main className="min-h-screen text-foreground font-sans">
        <PageNavbar />
        <div className="container mx-auto px-6 py-40 max-w-2xl text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h1 className="text-2xl font-bold text-white mb-3">
            {isNotFound
              ? lang === "es"
                ? "Artículo no encontrado"
                : "Article not found"
              : lang === "es"
                ? "Error al cargar el artículo"
                : "Error loading article"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isNotFound
              ? lang === "es"
                ? "El artículo que buscas no existe o ya no está publicado."
                : "The article you're looking for doesn't exist or is no longer published."
              : lang === "es"
                ? "Ocurrió un problema al cargar el artículo. Inténtalo de nuevo."
                : "Something went wrong loading this article. Please try again."}
          </p>
          <button
            onClick={() => setLocation("/blog")}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "es" ? "Volver al blog" : "Back to blog"}
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Vista del artículo ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen text-foreground font-sans">
      <PageNavbar />

      <article className="container mx-auto px-6 py-24 max-w-3xl">
        {/* Volver al blog */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <button
            onClick={() => setLocation("/blog")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "es" ? "Volver al blog" : "Back to blog"}
          </button>
        </motion.div>

        {/* Cabecera del artículo */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 space-y-4"
        >
          {/* Categoría */}
          {post.category_name && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary/80">
              <Tag className="w-3.5 h-3.5" />
              {post.category_name}
            </div>
          )}

          {/* Título */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-lg text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>

          {/* Meta: fecha + botón editar (solo si hay token admin) */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.created_at, lang)}
            </span>

            {isAdmin && (
              <button
                onClick={() => setLocation(`/admin`)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/40 rounded-lg px-3 py-1.5"
                title={
                  lang === "es"
                    ? "Editar este post en el panel admin"
                    : "Edit this post in admin panel"
                }
              >
                <Pencil className="w-3.5 h-3.5" />
                {lang === "es" ? "Editar" : "Edit"}
              </button>
            )}
          </div>
        </motion.header>

        {/* Imagen de portada */}
        {post.image_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10 rounded-2xl overflow-hidden aspect-video bg-card/40"
          >
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        {/* Contenido del artículo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-card prose-pre:border prose-pre:border-border
            prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
            prose-hr:border-border"
        >
          {/* El contenido se almacena como texto plano con saltos de línea.
              Cada párrafo separado por línea en blanco se renderiza como <p>.
              Cuando se integre un editor rich-text (TipTap), este bloque
              se reemplazará por el renderer correspondiente. */}
          {post.content.split(/\n\n+/).map((paragraph, i) => (
            <p key={i}>{paragraph.trim()}</p>
          ))}
        </motion.div>
      </article>

      <Footer />
      <WhatsAppButton />
    </main>
  );
}
