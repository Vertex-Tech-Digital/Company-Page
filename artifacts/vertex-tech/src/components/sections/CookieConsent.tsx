import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck, X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

const CONSENT_STORAGE_KEY = "vertex-tech-cookie-consent";
const CURRENT_VERSION = "1.0";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
  version: string;
}

export function CookieConsent() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    // Escuchar solicitudes de reapertura desde cualquier enlace del sitio (ej. Footer)
    const handleOpenPreferences = () => {
      setShowPreferences(true);
    };

    window.addEventListener("open-cookie-preferences", handleOpenPreferences);

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed: CookiePreferences = JSON.parse(stored);
        setAnalyticsAllowed(parsed.analytics === true);
      } else {
        // Retraso de 600ms para no bloquear la animación de entrada inicial de la página
        const timer = setTimeout(() => setShowBanner(true), 600);
        return () => {
          clearTimeout(timer);
          window.removeEventListener(
            "open-cookie-preferences",
            handleOpenPreferences,
          );
        };
      }
    } catch {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener(
        "open-cookie-preferences",
        handleOpenPreferences,
      );
    };
  }, []);

  const saveConsent = (analytics: boolean) => {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignorar fallos en contextos restringidos de almacenamiento
    }
    setAnalyticsAllowed(analytics);
    setShowBanner(false);
    setShowPreferences(false);

    window.dispatchEvent(
      new CustomEvent("cookie-consent-updated", { detail: preferences }),
    );
  };

  const handleAcceptAll = () => saveConsent(true);
  const handleRejectNonEssential = () => saveConsent(false);
  const handleSaveCustom = () => saveConsent(analyticsAllowed);

  return (
    <>
      {/* Banner Principal de Consentimiento (Inferior Flotante) */}
      <AnimatePresence>
        {showBanner && !showPreferences && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 pointer-events-auto"
            data-testid="cookie-banner"
            role="region"
            aria-label={t("cookie.banner.title")}
          >
            <div className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-2xl p-5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-col gap-4 text-foreground">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 text-primary">
                  <Cookie className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm tracking-wide text-white">
                    {t("cookie.banner.title")}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("cookie.banner.desc")}
                  </p>
                </div>
              </div>

              {/* Botones de acción al mismo nivel visual (Requisito AEPD) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <Button
                  onClick={handleAcceptAll}
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90 h-10 text-xs font-medium shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                  data-testid="cookie-accept-all"
                >
                  {t("cookie.banner.acceptAll")}
                </Button>
                <Button
                  onClick={handleRejectNonEssential}
                  variant="outline"
                  size="sm"
                  className="border-border hover:bg-white/5 text-xs text-foreground h-10 font-medium"
                  data-testid="cookie-reject"
                >
                  {t("cookie.banner.reject")}
                </Button>
                <Button
                  onClick={() => setShowPreferences(true)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-white/5 text-muted-foreground hover:text-white text-xs h-10 font-medium flex items-center justify-center gap-1.5"
                  data-testid="cookie-configure"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {t("cookie.banner.configure")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Configuración Granular */}
      <AnimatePresence>
        {showPreferences && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowPreferences(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 z-10 flex flex-col gap-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-modal-title"
              data-testid="cookie-modal"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h2
                    id="cookie-modal-title"
                    className="text-base font-bold text-white tracking-wide"
                  >
                    {t("cookie.modal.title")}
                  </h2>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-muted-foreground hover:text-white rounded-lg p-1 transition-colors"
                  aria-label="Cerrar modal de preferencias"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                {t("cookie.modal.desc")}
              </p>

              <div className="space-y-4">
                {/* Categoría: Técnicas (Obligatorias) */}
                <div className="bg-background/60 border border-border/70 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {t("cookie.modal.necessary.title")}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t("cookie.modal.necessary.desc")}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] tracking-wider font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {t("cookie.modal.necessary.badge")}
                  </span>
                </div>

                {/* Categoría: Analíticas (Opcionales) */}
                <div className="bg-background/60 border border-border/70 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-white">
                      {t("cookie.modal.analytics.title")}
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t("cookie.modal.analytics.desc")}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      className="sr-only peer"
                      aria-label="Permitir cookies analíticas"
                    />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary border border-border"></div>
                  </label>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
                <Button
                  onClick={handleRejectNonEssential}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-white w-full sm:w-auto"
                >
                  {t("cookie.banner.reject")}
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleAcceptAll}
                    variant="outline"
                    size="sm"
                    className="border-border text-xs text-foreground hover:bg-white/5 flex-1 sm:flex-initial"
                  >
                    {t("cookie.banner.acceptAll")}
                  </Button>
                  <Button
                    onClick={handleSaveCustom}
                    size="sm"
                    className="bg-primary text-white hover:bg-primary/90 text-xs flex-1 sm:flex-initial"
                  >
                    {t("cookie.modal.save")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
