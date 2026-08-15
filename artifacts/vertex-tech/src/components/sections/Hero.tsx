import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
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
    <section id="inicio" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
           <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight" data-testid="hero-title">
  {lang === "es" ? (
    <>Soluciones tecnológicas de alto{" "}
    <span className="text-primary">impacto</span>{" "}
    para los problemas de tu empresa</>
  ) : (
    <>High-impact tech{" "}
    <span className="text-primary">solutions</span>{" "}
    for your business challenges</>
  )}
</h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="hero-subtitle">
              {t("hero.subheadline")}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 sm:gap-6 w-full">
              <Button 
                asChild
                size="lg" 
                className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] text-base px-6 h-14 cursor-pointer"
                data-testid="hero-cta-audit"
              >
                <Link href="/diagnostico">
                  {t("hero.cta.audit")}
                </Link>
              </Button>
              <Button 
                onClick={() => scrollTo("#contacto")}
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-primary/50 text-white hover:bg-primary/10 text-base px-6 h-14 cursor-pointer"
                data-testid="hero-cta-primary"
              >
                {t("hero.cta.primary")}
              </Button>
              <a 
                href="#proyectos"
                onClick={(e) => { e.preventDefault(); scrollTo("#proyectos"); }}
                className="inline-flex items-center justify-center sm:justify-start gap-2 text-base font-semibold text-white hover:text-primary transition-colors cursor-pointer group py-3 px-2"
                data-testid="hero-cta-secondary"
              >
                <span>{t("hero.cta.secondary")}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
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
