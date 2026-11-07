import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { useLanguage } from "@/context/LanguageContext";

interface ApiPost {
  slug: string;
  title: string;
  excerpt: string;
  title_en: string | null;
  excerpt_en: string | null;
  image_url: string | null;
  created_at: string;
  category_name: string | null;
}

interface BlogPreview {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  createdAt: string;
}

type LoadStatus = "idle" | "loading" | "ready";

function formatDate(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(
    lang === "es" ? "es-ES" : "en-US",
    { day: "2-digit", month: "short", year: "numeric" },
  );
}

function toPreview(post: ApiPost, lang: string): BlogPreview {
  return {
    slug: post.slug,
    title: lang === "en" && post.title_en ? post.title_en : post.title,
    excerpt: lang === "en" && post.excerpt_en ? post.excerpt_en : post.excerpt,
    image: post.image_url ?? "",
    category:
      post.category_name ?? (lang === "es" ? "Sin categoría" : "Uncategorized"),
    date: formatDate(post.created_at, lang),
    createdAt: post.created_at,
  };
}

/**
 * Sección-resumen del blog dentro de la portada.
 *
 * Se apoya en `Reveal` (CSS) en vez de `BlogCard` porque ese componente usa
 * framer-motion y la portada debe seguir sin cargarlo (VTD-50). Los posts se
 * piden cuando la sección se acerca al viewport, no en el primer render.
 */
export function BlogSection() {
  const { lang, t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [posts, setPosts] = useState<BlogPreview[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const controller = new AbortController();
    let started = false;

    const load = async () => {
      if (started) return;
      started = true;
      setStatus("loading");

      try {
        const response = await fetch("/api/posts", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("posts");
        const data = (await response.json()) as { posts?: ApiPost[] };
        const rows = Array.isArray(data.posts) ? data.posts : [];
        setPosts(rows.slice(0, 3).map((post) => toPreview(post, lang)));
      } catch {
        if (!controller.signal.aborted) setPosts([]);
      } finally {
        if (!controller.signal.aborted) setStatus("ready");
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void load();
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      controller.abort();
    };
  }, [lang]);

  return (
    <section
      ref={sectionRef}
      id="blog"
      className="py-14 sm:py-20 lg:py-28 relative z-10 scroll-mt-24"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <Reveal y={20} className="max-w-2xl">
            <span className="text-xs font-mono tracking-widest uppercase text-primary/80 mb-3 inline-block">
              {t("home.blog.kicker")}
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
              data-testid="home-blog-title"
            >
              {t("home.blog.title")}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-cyan-400 rounded-full mb-5" />
            <p className="text-base text-slate-300 leading-relaxed">
              {t("home.blog.desc")}
            </p>
          </Reveal>

          <Reveal y={20} delay={0.1} className="shrink-0">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-300 transition-colors group py-1"
              data-testid="home-blog-cta"
            >
              {t("home.blog.cta")}
              <ArrowRight
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>

        {status !== "ready" ? (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-hidden="true"
          >
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="min-h-[360px] rounded-2xl border border-white/10 bg-slate-900/40 animate-pulse"
              />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal
                key={post.slug}
                y={24}
                delay={index * 0.08}
                className="h-full"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(0,107,230,0.15)] transition-all duration-300"
                  data-testid={`home-blog-card-${index}`}
                >
                  <div className="relative aspect-[2/1] overflow-hidden bg-slate-950">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-slate-950 to-cyan-400/10">
                        <FileText
                          className="w-10 h-10 text-primary/40"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-sm text-primary border border-primary/30">
                      {post.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-white leading-snug mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 mb-5">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-xs text-slate-400 border-t border-white/10 pt-4">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      <time dateTime={post.createdAt}>{post.date}</time>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal
            y={20}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 sm:p-10 text-center"
          >
            <FileText
              className="w-10 h-10 mx-auto mb-3 text-primary/30"
              aria-hidden="true"
            />
            <p className="font-semibold text-white mb-2">
              {t("home.blog.empty.title")}
            </p>
            <p className="text-sm text-slate-300 max-w-md mx-auto mb-5">
              {t("home.blog.empty.desc")}
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-300 transition-colors"
            >
              {t("home.blog.cta")}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
