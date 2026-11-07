import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl } from "@/lib/whatsapp";

// El formulario (react-hook-form + zod) es lo más pesado de la portada y está
// al final de la página: se descarga cuando la sección se acerca al viewport,
// no en el bundle de entrada (VTD-37).
const ContactForm = lazy(() => import("./ContactForm"));

// Mismo alto que el formulario vacío (384px, medido de 320 a 1536px de
// ancho) para que la tarjeta no cambie de tamaño cuando llegue el chunk.
function ContactFormPlaceholder() {
  return (
    <div className="min-h-[384px] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

export function Contact() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [loadForm, setLoadForm] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Margen amplio para que el chunk llegue antes de que el usuario vea la
    // sección (también cubre los enlaces a /#contacto desde otras páginas).
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadForm(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contacto"
      className="py-14 sm:py-20 lg:py-28 relative z-10 overflow-hidden scroll-mt-24"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          <Reveal x={-30}>
            <h2
              className="text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight tracking-tight"
              data-testid="contact-title"
            >
              {t("contact.title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                {t("contact.titleHighlight")}
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-4 sm:mb-5">
              {t("contact.subtitle")}
            </p>
            <p className="text-sm text-slate-400 mb-3">
              {t("contact.whatsapp.intro")}
            </p>
            <a
              href={getWhatsAppUrl(t("whatsapp.message"))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-5 py-3 text-sm font-semibold text-[#25D366] transition-all hover:border-[#25D366]/60 hover:bg-[#25D366]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] sm:w-auto"
              data-testid="contact-whatsapp"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t("whatsapp.cta")}
            </a>
          </Reveal>

          <Reveal
            x={30}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 sm:p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/40"
          >
            {loadForm ? (
              <Suspense fallback={<ContactFormPlaceholder />}>
                <ContactForm />
              </Suspense>
            ) : (
              <ContactFormPlaceholder />
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
