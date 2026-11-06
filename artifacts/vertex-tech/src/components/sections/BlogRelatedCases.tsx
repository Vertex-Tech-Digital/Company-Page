import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, BookOpen } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { CasoCard, type CasoPreview } from "@/components/sections/CasoCard";
import { getCasos } from "@/content/casos";
import { useLanguage } from "@/context/LanguageContext";

interface BlogRelatedCasesProps {
  postTags?: string[];
  postCategory?: string | null;
}

function formatDate(dateStr: string, lang: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    if (!y) return dateStr;
    return new Date(y, (m ?? 1) - 1, d || 1).toLocaleDateString(
      lang === "es" ? "es-ES" : "en-US",
      { day: "2-digit", month: "short", year: "numeric" },
    );
  } catch {
    return dateStr;
  }
}

function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim();
}

export function BlogRelatedCases({
  postTags = [],
  postCategory,
}: BlogRelatedCasesProps) {
  const { lang } = useLanguage();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [relatedCases, setRelatedCases] = useState<CasoPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getCasos(lang)
      .then((casos) => {
        if (!alive) return;

        const normalizedPostTags = postTags.map(normalizeTag).filter(Boolean);
        const normalizedCategory = postCategory
          ? normalizeTag(postCategory)
          : null;

        const scored = casos
          .filter((caso) => caso && caso.slug)
          .map((caso) => {
            let score = 0;
            const casoTags = (caso.tags || []).map(normalizeTag);

            // Coincidencias por tags
            for (const postTag of normalizedPostTags) {
              if (casoTags.includes(postTag)) {
                score += 3;
              }
            }

            // Coincidencia por categoría/pseudónimo como fallback
            if (normalizedCategory) {
              if (normalizeTag(caso.pseudonym) === normalizedCategory) {
                score += 1;
              }
              // También buscar en título/excerpt
              if (normalizeTag(caso.title).includes(normalizedCategory)) {
                score += 1;
              }
            }

            return { caso, score };
          });

        // Si hay coincidencias, priorizar por score
        const withMatches = scored.filter((s) => s.score > 0);
        let selected: typeof scored;

        if (withMatches.length > 0) {
          // Ordenar por score desc, luego por fecha desc
          selected = withMatches.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.caso.date.localeCompare(a.caso.date);
          });
        } else {
          // Sin coincidencias: mostrar aleatorios (mezclados)
          selected = [...scored].sort(() => Math.random() - 0.5);
        }

        const previews = selected.slice(0, 4).map((item) => ({
          slug: item.caso.slug,
          coverImage: item.caso.cover,
          pseudonym: item.caso.pseudonym,
          tags: item.caso.tags,
          title: item.caso.title,
          excerpt: item.caso.excerpt,
          date: formatDate(item.caso.date, lang),
        }));

        setRelatedCases(previews);
      })
      .catch(() => {
        if (alive) setRelatedCases([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [lang, postTags, postCategory]);

  if (loading) {
    return (
      <section className="mt-20 pt-16 border-t border-border/50">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (relatedCases.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 pt-16 border-t border-border/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="text-xs font-mono tracking-widest uppercase text-primary/80">
            {lang === "es" ? "Casos Conceptuales" : "Conceptual Cases"}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {lang === "es"
            ? "Casos conceptuales relacionados"
            : "Related conceptual cases"}
        </h2>
        <p className="text-muted-foreground">
          {lang === "es"
            ? "Descubre situaciones reales similares que te pueden servir de referencia"
            : "Discover similar real situations that can serve as reference"}
        </p>
      </motion.div>

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: relatedCases.length > 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {relatedCases.map((caso, index) => (
            <CarouselItem
              key={caso.slug}
              className="pl-4 md:basis-1/2 lg:basis-1/2"
            >
              <CasoCard caso={caso} index={index} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {relatedCases.length > 1 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
            <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm border-border hover:bg-background" />
          </>
        )}
      </Carousel>

      {count > 1 && (
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index + 1 === current ? "bg-primary" : "bg-border"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
