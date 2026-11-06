import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { BlogCard, type BlogPostPreview } from "@/components/sections/BlogCard";
import { CasoCard, type CasoPreview } from "@/components/sections/CasoCard";
import { getCasos } from "@/content/casos";
import { useLanguage } from "@/context/LanguageContext";

// ── Tipos que devuelve la API ────────────────────────────────────────────────

interface ApiPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  title_en: string | null;
  excerpt_en: string | null;
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
    { day: "2-digit", month: "short", year: "numeric" },
  );
}

function apiPostToPreview(post: ApiPost, lang: string): BlogPostPreview {
  // Si el post no tiene traducción al inglés, se muestra el contenido en
  // español como respaldo en vez de dejar la tarjeta vacía.
  const title = lang === "en" && post.title_en ? post.title_en : post.title;
  const excerpt =
    lang === "en" && post.excerpt_en ? post.excerpt_en : post.excerpt;
  return {
    slug: post.slug,
    image: post.image_url ?? "",
    category:
      post.category_name ?? (lang === "es" ? "Sin categoría" : "Uncategorized"),
    title,
    excerpt,
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

  const [casos, setCasos] = useState<CasoPreview[]>([]);

  // Cargar categorías una sola vez al montar el componente
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {}); // las categorías son decorativas — si fallan, no bloquean
  }, []);

  // Cargar casos conceptuales (contenido MDX estático del repositorio)
  useEffect(() => {
    let alive = true;
    getCasos(lang)
      .then((data) => {
        if (!alive) return;
        setCasos(
          (data || [])
            .filter((c) => c && c.slug)
            .map((c) => ({
              slug: c.slug,
              coverImage: c.cover,
              pseudonym: c.pseudonym,
              tags: c.tags,
              title: c.title,
              excerpt: c.excerpt,
              date: formatDate(c.date, lang),
            })),
        );
      })
      .catch(() => {
        if (alive) setCasos([]);
      });
    return () => {
      alive = false;
    };
  }, [lang]);

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
            : "Could not load articles. Please try again.",
        ),
      )
      .finally(() => setLoading(false));
  }, [selectedCategory, lang]);

  const previews = posts.map((p) => apiPostToPreview(p, lang));

  return (
    <main className="min-h-screen text-foreground font-sans">
      <Navbar />

      {/* Header / Hero del blog + filtros */}
      <section className="relative pt-28 sm:pt-32 lg:pt-36 pb-6 sm:pb-8 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, hsl(212 100% 56% / 0.15), transparent 60%)",
          }}
        />
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <span className="text-xs font-mono tracking-widest uppercase text-primary/80 mb-3 sm:mb-4 inline-block">
                {lang === "es" ? "Blog de Vertex Tech" : "Vertex Tech Blog"}
              </span>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-5 leading-tight"
                data-testid="blog-title"
              >
                {lang === "es" ? (
                  <>
                    Ideas y aprendizajes sobre{" "}
                    <span className="text-primary">tecnología y calidad</span>
                  </>
                ) : (
                  <>
                    Ideas and insights on{" "}
                    <span className="text-primary">technology and quality</span>
                  </>
                )}
              </h1>
              <p
                className="text-base sm:text-lg text-muted-foreground leading-relaxed"
                data-testid="blog-subtitle"
              >
                {lang === "es"
                  ? "Artículos sobre desarrollo, QA, integraciones e inteligencia artificial, escritos por el equipo de Vertex Tech."
                  : "Articles on development, QA, integrations and artificial intelligence, written by the Vertex Tech team."}
              </p>
            </motion.div>

            {(categories.length > 0 || casos.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="w-full lg:max-w-sm lg:justify-self-end"
              >
                {categories.length > 0 && (
                  <>
                    <p className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/70 mb-3">
                      {lang === "es"
                        ? "Filtrar por categoría"
                        : "Filter by category"}
                    </p>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                          selectedCategory === null
                            ? "bg-primary-solid text-white border-primary-solid font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-white"
                        }`}
                      >
                        {lang === "es" ? "Todos" : "All"}
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                            selectedCategory === cat.slug
                              ? "bg-primary-solid text-white border-primary-solid font-semibold"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-white"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {casos.length > 0 && (
                  <div
                    className={
                      categories.length > 0 ? "mt-3 lg:flex lg:justify-end" : ""
                    }
                  >
                    <a
                      href="#casos-conceptuales"
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {lang === "es"
                          ? "Casos Conceptuales"
                          : "Conceptual Cases"}
                      </span>
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-mono font-semibold">
                        {casos.length}
                      </span>
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Grid de artículos */}
      <section className="pb-14 sm:pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
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
            <div className="text-center py-14 text-muted-foreground border border-white/5 bg-slate-900/30 rounded-2xl p-6 sm:p-10 mb-8">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-white mb-1.5">
                {lang === "es"
                  ? "Próximamente publicaremos nuevos artículos técnicos."
                  : "New technical articles will be published soon."}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground/80 max-w-md mx-auto">
                {lang === "es"
                  ? "Mientras tanto, puedes consultar nuestros Casos Conceptuales a continuación para conocer problemas reales y cómo los solucionamos."
                  : "In the meantime, you can explore our Conceptual Cases below to see real-world problems and how we solve them."}
              </p>
            </div>
          )}

          {/* Artículo destacado + grid */}
          {!loading && !error && previews.length > 0 && (
            <div className="space-y-6 sm:space-y-8">
              <BlogCard post={previews[0]} index={0} featured />

              {previews.length > 1 && (
                <div className="grid gap-6 sm:grid-cols-2 sm:gap-7 xl:grid-cols-3 xl:gap-8">
                  {previews.slice(1).map((post, index) => (
                    <BlogCard key={post.slug} post={post} index={index + 1} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Sección de Casos Conceptuales en el Blog ── */}
      {casos.length > 0 && (
        <section
          id="casos-conceptuales"
          className="pb-16 sm:pb-20 border-t border-white/10 pt-12 sm:pt-14 relative z-10"
        >
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
              <div className="max-w-2xl">
                <span className="text-xs font-mono tracking-widest uppercase text-primary/80 mb-3 inline-block">
                  {lang === "es"
                    ? "Casos Conceptuales"
                    : "Conceptual Case Studies"}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
                  {lang === "es" ? (
                    <>
                      Situaciones reales contadas por{" "}
                      <span className="text-primary">
                        empresas como la tuya
                      </span>
                    </>
                  ) : (
                    <>
                      Real situations told by{" "}
                      <span className="text-primary">companies like yours</span>
                    </>
                  )}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {lang === "es"
                    ? "Descubre cómo otras organizaciones detectaron, diagnosticaron y resolvieron problemas reales de integración, lentitud y calidad técnica."
                    : "Learn how companies identified, diagnosed, and resolved real-world challenges in integration, speed, and technical quality."}
                </p>
              </div>

              <Link
                href="/casos-conceptuales"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-blue-300 transition-colors shrink-0 group py-1"
                data-testid="blog-to-casos-link"
              >
                <span>
                  {lang === "es"
                    ? "Explorar todos los casos"
                    : "Explore all cases"}
                </span>
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* Con un solo caso se muestra a todo el ancho; con más, en rejilla */}
            {casos.length === 1 ? (
              <CasoCard caso={casos[0]} index={0} featured />
            ) : (
              <div
                className={`grid gap-6 sm:grid-cols-2 sm:gap-8 ${
                  casos.length >= 3 ? "lg:grid-cols-3" : ""
                }`}
              >
                {casos.map((caso, index) => (
                  <CasoCard key={caso.slug} caso={caso} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
