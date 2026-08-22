import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Calendar, User } from "lucide-react";
import { PageNavbar } from "@/components/sections/PageNavbar";
import { Footer } from "@/components/sections/Footer";
import { ScrollTopButton } from "@/components/sections/ScrollTopButton";
import { CasoShare } from "@/components/sections/CasoShare";
import { getCasoBySlug } from "@/content/casos";
import { useLanguage } from "@/context/LanguageContext";

function formatDate(dateStr: string, lang: string): string {
  // dateStr es ISO (yyyy-mm-dd); se normaliza para evitar desfases de zona
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d).toLocaleDateString(
    lang === "es" ? "es-ES" : "en-US",
    { day: "2-digit", month: "long", year: "numeric" },
  );
}

// ── Vista individual de un Caso Conceptual ───────────────────────────────────

// Contenido estático (MDX del repo), bien espaciado y acorde al diseño del
// sitio. Incluye botón de compartir; sin sección de comentarios.
export default function CasoConceptual() {
  const { lang } = useLanguage();
  const [, setLocation] = useLocation();

  // Wouter: extrae el slug de la URL /casos-conceptuales/:slug
  const [matched, params] = useRoute("/casos-conceptuales/:slug");
  const slug = matched ? params?.slug : null;

  const caso = slug ? getCasoBySlug(slug) : undefined;

  // Scroll al inicio al cambiar de caso
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  function backToList() {
    setLocation("/casos-conceptuales");
  }

  // ── Estado: no encontrado ────────────────────────────────────────────────────
  if (!caso) {
    return (
      <main className="min-h-screen text-foreground font-sans">
        <PageNavbar />
        <div className="container mx-auto px-6 py-40 max-w-2xl text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h1 className="text-2xl font-bold text-white mb-3">
            {lang === "es" ? "Caso no encontrado" : "Case not found"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {lang === "es"
              ? "El caso que buscas no existe o ya no está publicado."
              : "The case you're looking for doesn't exist or is no longer published."}
          </p>
          <button
            onClick={backToList}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "es" ? "Volver a los casos" : "Back to cases"}
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const Content = caso.Component;

  // ── Vista del caso ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen text-foreground font-sans">
      <PageNavbar />

      <article className="container mx-auto px-6 py-24 max-w-3xl">
        {/* Volver al listado */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12"
        >
          <button
            onClick={backToList}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "es" ? "Volver a los casos" : "Back to cases"}
          </button>
        </motion.div>

        {/* Cabecera del caso */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14 space-y-5"
        >
          {/* Seudónimo de la empresa */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-primary/80 uppercase tracking-widest">
            <User className="w-3.5 h-3.5" />
            {caso.pseudonym}
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            {caso.title}
          </h1>

          {/* Resumen */}
          <p className="text-lg text-muted-foreground leading-relaxed">
            {caso.excerpt}
          </p>

          {/* Meta: fecha + etiquetas */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 border-t border-border/50">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(caso.date, lang)}
            </span>
            {caso.tags && caso.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {caso.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary/90 font-mono text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.header>

        {/* Imagen de portada */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-14 rounded-2xl overflow-hidden aspect-video bg-card/40 border border-border/50"
        >
          <img
            src={caso.cover}
            alt={caso.title}
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Contenido MDX */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          data-testid="caso-content"
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-ul:text-muted-foreground prose-ol:text-muted-foreground
            prose-li:marker:text-primary/60
            prose-img:rounded-2xl prose-img:border prose-img:border-border/50
            prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-hr:border-border"
        >
          <Content />
        </motion.div>

        {/* Compartir en redes — sin sección de comentarios */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <CasoShare title={caso.title} />
        </motion.div>
      </article>

      <Footer />
      <ScrollTopButton />
    </main>
  );
}
