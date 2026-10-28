import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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
      id="contacto"
      className="py-20 lg:py-28 relative z-10 overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight"
              data-testid="contact-title"
            >
              {t("contact.title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                {t("contact.titleHighlight")}
              </span>
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {t("contact.subtitle")}
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-2xl shadow-2xl shadow-black/40"
          >
            {isSuccess ? (
              <m.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
                role="status"
                aria-live="polite"
                data-testid="contact-success"
              >
                <CheckCircle2
                  className="w-16 h-16 text-primary mb-6"
                  aria-hidden="true"
                />
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {t("contact.success.title")}
                </h3>
                <p className="text-slate-300">{t("contact.success.desc")}</p>
                <Button
                  variant="outline"
                  className="mt-8 border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                  onClick={() => {
                    setIsSuccess(false);
                    form.reset();
                  }}
                >
                  {t("contact.success.another")}
                </Button>
             </m.div>
            ) : (
  <Suspense fallback={<ContactFormPlaceholder />}>
    <ContactForm />
  </Suspense>
)}
</m.div>      
