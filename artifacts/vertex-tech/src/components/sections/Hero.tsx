import { motion } from "framer-motion";
import { Link } from "wouter";
// import { ArrowRight } from "lucide-react"; // oculto temporalmente
import { Button } from "@/components/ui/button";
import { WireframeCube } from "./WireframeCube";
import { useLanguage } from "@/context/LanguageContext";

export function Hero() {
  const { t, lang } = useLanguage();

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
    >
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl relative"
          >
            {/* Sutil resplandor de contraste para aislar el texto frente a las partículas del canvas */}
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-background/65 blur-2xl pointer-events-none" />

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] font-bold tracking-tight text-white mb-5 leading-[1.08] drop-shadow-[0_2px_12px_rgba(10,15,29,0.9)]"
              data-testid="hero-title"
            >
              {lang === "es" ? (
                <>
                  Soluciones tecnológicas de alto{" "}
                  <span className="text-primary">impacto</span> para tu empresa
                </>
              ) : (
                <>
                  High-impact tech{" "}
                  <span className="text-primary">solutions</span> for your
                  business
                </>
              )}
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 leading-relaxed max-w-xl drop-shadow-[0_2px_10px_rgba(10,15,29,0.85)]"
              data-testid="hero-subtitle"
            >
              {t("hero.subheadline")}
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                asChild
                size="lg"
                className="bg-primary-solid text-white hover:bg-primary-solid-hover shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] text-base px-7 h-12"
                data-testid="hero-cta-primary"
              >
                <Link href="/diagnostico">{t("hero.cta.audit")}</Link>
              </Button>
              <Button
                onClick={() => scrollTo("#contacto")}
                variant="outline"
                size="lg"
                className="border-border hover:bg-white/5 text-base px-7 h-12"
                data-testid="hero-cta-secondary"
              >
                {t("hero.cta.primary")}
              </Button>
              {/* Enlace a proyectos oculto temporalmente
              <a
                href="#proyectos"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo("#proyectos");
                }}
                className="inline-flex items-center justify-center sm:justify-start gap-2 text-base font-semibold text-white hover:text-primary transition-colors cursor-pointer group py-3 px-2"
                data-testid="hero-cta-secondary"
              >
                <span>{t("hero.cta.secondary")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              */}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="hidden lg:block"
          >
            <WireframeCube />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
