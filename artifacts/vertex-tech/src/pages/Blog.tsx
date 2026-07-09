import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, FileText } from "lucide-react";
import { PageNavbar } from "@/components/sections/PageNavbar";
import { Footer } from "@/components/sections/Footer";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { BlogCard, type BlogPostPreview } from "@/components/sections/BlogCard";
import { useLanguage } from "@/context/LanguageContext";

// ── Tipos que devuelve la API ────────────────────────────────────────────────

interface ApiPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  created_at: string;
  category_name: string | null;
  category_slug: string | null;
}

interface ApiCategory {
  id: number;
  slug: string;
  name: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(
    lang === "es" ? "es-ES" : "en-US",
    { day: "2-digit", month: "short", year: "numeric" }
  );
}

function apiPostToPreview(post: ApiPost, lang: string): BlogPostPreview {
  return {
    slug: post.slug,
    image: post.image_url ?? "",
    category: post.category_name ?? (lang === "es" ? "Sin categoría" : "Uncategorized"),
    title: post.title,
    excerpt: post.excerpt,
    date: formatDate(post.created_at, lang),
  };
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function Blog() {
  const { lang } = useLanguage();

  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías una sola vez al montar el componente
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {}); // las categorías son decorativas — si fallan, no bloquean
  }, []);

  // Cargar posts cada vez que cambia el filtro de categoría
  useEffect(() => {
    setLoading(true);
    setError(null);

    const url = selectedCategory
      ? `/api/posts?category=${selectedCategory}`
      : "/api/posts";

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar los artículos");
        return r.json();
      })
      .then((data) => setPosts(data.posts ?? []))
      .catch(() =>
        setError(
          lang === "es"
            ? "No se pudieron cargar los artículos. Inténtalo de nuevo."
            : "Could not load articles. Please try again."
        )
      )
      .finally(() => setLoading(false));
  }, [selectedCategory, lang]);

  const previews = posts.map((p) => apiPostToPreview(p, lang));

  return (
    <main className="min-h-screen text-foreground font-sans">
      <PageNavbar />

      {/* Header / Hero del blog */}
      <section className="relative pt-40 pb-12 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, hsl(212 100% 56% / 0.15), transparent 60%)",
          }}
        />
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <span className="text-xs font-mono tracking-widest uppercase text-primary/80 mb-4 inline-block">
              {lang === "es" ? "Blog de Vertex Tech" : "Vertex Tech Blog"}
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
              data-testid="blog-title"
            >
              {lang === "es" ? (
                <>Ideas y aprendizajes sobre{" "}
                  <span className="text-primary">tecnología y calidad</span>
                </>
              ) : (
                <>Ideas and insights on{" "}
                  <span className="text-primary">technology and quality</span>
                </>
              )}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid="blog-subtitle">
              {lang === "es"
                ? "Artículos sobre desarrollo, QA, integraciones e inteligencia artificial, escritos por el equipo de Vertex Tech."
                : "Articles on development, QA, integrations and artificial intelligence, written by the Vertex Tech team."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filtro por categoría */}
      {categories.length > 0 && (
        <section className="container mx-auto px-6 pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-white"
              }`}
            >
              {lang === "es" ? "Todos" : "All"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Grid de artículos */}
      <section className="pb-24 relative z-10">
        <div className="container mx-auto px-6">

          {/* Estado: cargando */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {lang === "es" ? "Cargando artículos..." : "Loading articles..."}
            </div>
          )}

          {/* Estado: error */}
          {!loading && error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-6 py-4 max-w-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Estado: sin posts */}
          {!loading && !error && previews.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>
                {lang === "es"
                  ? "Aún no hay artículos publicados. ¡Vuelve pronto!"
                  : "No articles published yet. Check back soon!"}
              </p>
            </div>
          )}

          {/* Grid de cards */}
          {!loading && !error && previews.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-8">
              {previews.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          )}

        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
}
