import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Github } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

type ModalKey = "legal" | "privacy" | "cookies" | null;

function LegalModal({
  open,
  title,
  body,
  closeLabel,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-white transition-colors rounded-lg p-1 hover:bg-white/5"
                  aria-label={closeLabel}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
              <div className="px-6 pb-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-white bg-primary hover:bg-primary/90 px-5 py-2 rounded-lg transition-colors"
                >
                  {closeLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Footer() {
  const { t } = useLanguage();
  const [modal, setModal] = useState<ModalKey>(null);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const legalLinks: { key: ModalKey; label: string }[] = [
    { key: "legal", label: t("footer.legal") },
    { key: "privacy", label: t("footer.privacy") },
    { key: "cookies", label: t("footer.cookies") },
  ];

  return (
    <>
      <LegalModal
        open={modal === "legal"}
        title={t("footer.legal.title")}
        body={t("footer.legal.body")}
        closeLabel={t("footer.close")}
        onClose={() => setModal(null)}
      />
      <LegalModal
        open={modal === "privacy"}
        title={t("footer.privacy.title")}
        body={t("footer.privacy.body")}
        closeLabel={t("footer.close")}
        onClose={() => setModal(null)}
      />
      <LegalModal
        open={modal === "cookies"}
        title={t("footer.cookies.title")}
        body={t("footer.cookies.body")}
        closeLabel={t("footer.close")}
        onClose={() => setModal(null)}
      />

      <footer className="border-t border-border bg-background pt-14 pb-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            {/* Brand */}
            <div className="max-w-xs">
              <div
                className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-3"
                data-testid="footer-logo"
              >
                Vertex Tech<span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Nav links */}
            <div className="flex flex-wrap gap-6">
              {[
                { href: "#servicios", label: t("nav.servicios") },
                { href: "#proyectos", label: t("nav.proyectos") },
                { href: "#metodologia", label: t("nav.metodologia") },
                { href: "#contacto", label: t("nav.contactar") },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => { e.preventDefault(); scrollTo(href); }}
                  className="cursor-pointer text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>

            {/* GitHub */}
            <a
              href="https://github.com/Vertex-Tech-Digital"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
              data-testid="footer-github"
            >
              <Github className="w-4 h-4" />
              {t("footer.github")}
            </a>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground order-2 sm:order-1">
              &copy; {t("footer.copyright")}
            </p>

            <div className="flex items-center gap-5 order-1 sm:order-2">
              {legalLinks.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setModal(key)}
                  className="cursor-pointer text-xs text-muted-foreground hover:text-white transition-colors underline-offset-2 hover:underline"
                  data-testid={`footer-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
