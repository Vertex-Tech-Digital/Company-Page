import { Link } from "wouter";
import { ArrowRight, Clock, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Sección-resumen del diagnóstico gratuito dentro de la portada.
 *
 * El formulario completo vive en /diagnostico: incrustarlo aquí duplicaría una
 * página entera y cargaría framer-motion + validaciones en el bundle de
 * entrada. Esta sección actúa como banda de conversión con un CTA claro.
 */
export function DiagnosticoSection() {
  const { t } = useLanguage();

  const benefits = [
    { icon: Sparkles, label: t("home.diagnosis.benefit1") },
    { icon: Clock, label: t("home.diagnosis.benefit2") },
    { icon: FileText, label: t("home.diagnosis.benefit3") },
  ];

  const scrollToContact = () => {
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="diagnostico"
      className="py-14 sm:py-20 lg:py-28 relative z-10 scroll-mt-24"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <Reveal
          y={24}
          className="relative overflow-hidden rounded-3xl border border-primary/25 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-10 lg:p-14 shadow-2xl shadow-black/40"
        >
          {/* Resplandores decorativos */}
          <div
            className="absolute -top-32 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-40 -left-24 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-8 lg:gap-14 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-primary/90 mb-4">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                {t("home.diagnosis.kicker")}
              </span>

              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight"
                data-testid="home-diagnosis-title"
              >
                {t("home.diagnosis.title")}
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-6">
                {t("home.diagnosis.desc")}
              </p>

              <ul className="flex flex-wrap gap-2.5 sm:gap-3 list-none p-0 m-0">
                {benefits.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3.5 py-2 text-xs sm:text-sm text-slate-200"
                  >
                    <Icon
                      className="w-4 h-4 text-primary shrink-0"
                      aria-hidden="true"
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 sm:p-7 shadow-lg shadow-black/30">
              <p className="text-sm text-slate-300 leading-relaxed mb-5">
                {t("home.diagnosis.note")}
              </p>

              <Button
                asChild
                size="lg"
                className="w-full bg-primary-solid text-white hover:bg-primary-solid-hover shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
              >
                <Link href="/diagnostico" data-testid="home-diagnosis-cta">
                  {t("home.diagnosis.cta")}
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>

              <button
                type="button"
                onClick={scrollToContact}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-white/10 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-testid="home-diagnosis-secondary"
              >
                {t("home.diagnosis.secondary")}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
