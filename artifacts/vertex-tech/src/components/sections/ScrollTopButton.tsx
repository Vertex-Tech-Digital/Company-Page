import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const SCROLL_THRESHOLD = 300;

// Botón circular "volver arriba" con anillo que se colorea de azul según el
// progreso de lectura de la página. Sustituye al botón de WhatsApp en el
// detalle de un Caso Conceptual. Comportamiento idéntico en móvil y escritorio.
export function ScrollTopButton() {
  const { lang } = useLanguage();
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) =>
    setVisible(y > SCROLL_THRESHOLD),
  );

  return (
    <motion.button
      type="button"
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.8,
        pointerEvents: visible ? "auto" : "none",
      }}
      whileHover={visible ? { scale: 1.1 } : undefined}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={
        lang === "es" ? "Volver al inicio de la página" : "Back to top"
      }
      data-testid="scroll-top-button"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-card/90 backdrop-blur-sm border border-border shadow-[0_4px_24px_0_rgba(59,130,246,0.35)] hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.55)] transition-shadow duration-300"
    >
      {/* Anillo: base neutra + arco azul proporcional al scroll */}
      <svg
        viewBox="0 0 56 56"
        className="absolute inset-0 w-full h-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          strokeWidth="3"
          className="stroke-border"
        />
        <motion.circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-primary"
          style={{ pathLength: scrollYProgress }}
        />
      </svg>
      <ArrowUp className="w-6 h-6 relative z-10 text-primary" />
    </motion.button>
  );
}
