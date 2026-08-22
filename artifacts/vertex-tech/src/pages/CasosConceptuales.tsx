import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { PageNavbar } from "@/components/sections/PageNavbar";
import { Footer } from "@/components/sections/Footer";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { CasoCard, type CasoPreview } from "@/components/sections/CasoCard";
import { casos } from "@/content/casos";
import { useLanguage } from "@/context/LanguageContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, lang: string): string {
  // dateStr es ISO (yyyy-mm-dd); se normaliza para evitar desfases de zona
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d).toLocaleDateString(
    lang === "es" ? "es-ES" : "en-US",
    { day: "2-digit", month: "short", year: "numeric" },
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

// Listado público de Casos Conceptuales: ejemplos estáticos (MDX) que sirven
// de guía a los clientes. Sin base de datos — el contenido vive en el repo.
export default function CasosConceptuales() {
  const { lang } = useLanguage();

  const previews: CasoPreview[] = casos.map((caso) => ({
    slug: caso.slug,
    coverImage: caso.cover,
    pseudonym: caso.pseudonym,
    tags: caso.tags,
    title: caso.title,
    excerpt: caso.excerpt,
    date: formatDate(caso.date, lang),
  }));

  return (
    <main className="min-h-screen text-foreground font-sans">
      <PageNavbar />

      {/* Header / Hero de casos conceptuales */}
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
          >
            <span className="text-xs font-mono tracking-widest uppercase text-primary/80 mb-4 inline-block">
              {lang === "es" ? "Casos Conceptuales" : "Conceptual Cases"}
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
              data-testid="casos-title"
            >
              {lang === "es" ? (
                <>
                  Situaciones reales contadas por{" "}
                  <span className="text-primary">empresas como la tuya</span>
                </>
              ) : (
                <>
                  Real situations told by{" "}
                  <span className="text-primary">companies like yours</span>
                </>
              )}
            </h1>
            <p
              className="text-lg text-muted-foreground leading-relaxed"
              data-testid="casos-subtitle"
            >
              {lang === "es"
                ? "Ejemplos de casos que muestran cómo otras empresas han vivido y resuelto situaciones en su organización: qué pasó, cómo lo afrontaron y qué aprendieron."
                : "Example cases showing how other companies have experienced and resolved situations in their organization: what happened, how they dealt with it and what they learned."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid de casos */}
      <section className="pb-24 relative z-10">
        <div className="container mx-auto px-6">
          {/* Estado: sin casos */}
          {previews.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p data-testid="casos-empty">
                {lang === "es"
                  ? "Aún no hay casos publicados. ¡Vuelve pronto!"
                  : "No cases published yet. Check back soon!"}
              </p>
            </div>
          )}

          {/* Grid de cards */}
          {previews.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-8">
              {previews.map((caso, index) => (
                <CasoCard key={caso.slug} caso={caso} index={index} />
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
