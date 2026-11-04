import { useState, useEffect } from "react";
import { Link as WouterLink, useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const { lang, setLang, t } = useLanguage();
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = [
        "inicio",
        "servicios",
        "proyectos",
        "metodologia",
        "contacto",
      ];
      const current = sections.find((section) => {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { id: "inicio", href: "#inicio" },
    { id: "servicios", href: "#servicios" },
    // { id: "proyectos", href: "#proyectos" }, // oculto temporalmente
    { id: "metodologia", href: "#metodologia" },
  ];

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    if (location !== "/") {
      window.location.href = "/" + href;
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label={lang === "es" ? "Navegación principal" : "Main navigation"}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/30"
          : "bg-slate-950/40 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <a
          href="#inicio"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("#inicio");
          }}
          className="flex items-center gap-3 group"
          data-testid="nav-logo"
        >
          <img
            src="/logo-88.webp"
            srcSet="/logo-44.webp 1x, /logo-88.webp 2x, /logo-132.webp 3x"
            width={44}
            height={44}
            decoding="async"
            alt="Vertex Tech"
            className="h-11 w-11 rounded-xl object-cover transition-transform group-hover:scale-105 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]"
          />
          <div className="flex flex-col leading-none">
            <span
              className="text-lg font-bold tracking-widest uppercase text-white"
              style={{ fontFamily: "var(--app-font-heading)" }}
            >
              Vertex Tech
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.9)] ml-1 mb-0.5 align-middle"></span>
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-primary/70 font-medium">
              {t("nav.tagline")}
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(link.href);
              }}
              className={`text-sm font-medium transition-colors hover:text-white ${
                location === "/" && activeSection === link.id
                  ? "text-primary font-semibold"
                  : "text-slate-300"
              }`}
              data-testid={`nav-link-${link.id}`}
            >
              {t(`nav.${link.id}`)}
            </a>
          ))}

          <WouterLink
            href="/diagnostico"
            className={`text-sm font-medium transition-colors hover:text-white ${
              location === "/diagnostico"
                ? "text-primary font-semibold"
                : "text-slate-300"
            }`}
            data-testid="nav-link-diagnostico"
          >
            {t("nav.diagnostico")}
          </WouterLink>

          <WouterLink
            href="/casos-conceptuales"
            className={`text-sm font-medium transition-colors hover:text-white ${
              location.startsWith("/casos-conceptuales")
                ? "text-primary font-semibold"
                : "text-slate-300"
            }`}
            data-testid="nav-link-casos"
          >
            {t("nav.casos")}
          </WouterLink>

          {/* TODO: Reactivar cuando el blog esté listo (actualmente en desarrollo)
          <WouterLink
            href="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            data-testid="nav-link-blog"
          >
            {t("nav.blog")}
          </WouterLink>
          */}

          <div className="flex items-center gap-1 text-xs tracking-widest uppercase">
            <button
              onClick={() => setLang("es")}
              aria-pressed={lang === "es"}
              aria-label={t("nav.lang.es")}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                lang === "es"
                  ? "text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
              data-testid="lang-toggle-es"
            >
              ES
            </button>
            <span className="text-muted-foreground/50" aria-hidden="true">
              |
            </span>
            <button
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              aria-label={t("nav.lang.en")}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                lang === "en"
                  ? "text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
              data-testid="lang-toggle-en"
            >
              EN
            </button>
          </div>

          <Button
            onClick={() => scrollTo("#contacto")}
            className="bg-primary-solid text-white hover:bg-primary-solid-hover shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            data-testid="nav-cta"
          >
            {t("nav.contactar")}
          </Button>
        </div>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden text-white p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={t(mobileMenuOpen ? "nav.closeMenu" : "nav.openMenu")}
          aria-expanded={mobileMenuOpen}
          aria-controls="nav-mobile-menu"
          data-testid="nav-mobile-toggle"
        >
          {mobileMenuOpen ? (
            <X size={24} aria-hidden="true" />
          ) : (
            <Menu size={24} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 w-full bg-slate-950/98 backdrop-blur-xl border-b border-white/10 p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 md:hidden shadow-2xl max-h-[calc(100dvh-5rem)] overflow-y-auto pb-[max(2rem,env(safe-area-inset-bottom))]"
            data-testid="nav-mobile-menu"
          >
            <div className="flex justify-end items-center gap-2 text-sm tracking-widest uppercase mb-1">
              <button
                onClick={() => setLang("es")}
                aria-pressed={lang === "es"}
                aria-label={t("nav.lang.es")}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded px-2.5 py-1 ${lang === "es" ? "text-white font-semibold" : "text-slate-400 hover:text-white"}`}
              >
                ES
              </button>
              <span
                className="text-muted-foreground/50 select-none"
                aria-hidden="true"
              >
                |
              </span>
              <button
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                aria-label={t("nav.lang.en")}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded px-2.5 py-1 ${lang === "en" ? "text-white font-semibold" : "text-slate-400 hover:text-white"}`}
              >
                EN
              </button>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(link.href);
                }}
                className={`text-lg font-medium transition-colors min-h-[44px] flex items-center ${
                  location === "/" && activeSection === link.id
                    ? "text-primary font-semibold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {t(`nav.${link.id}`)}
              </a>
            ))}

            <WouterLink
              href="/diagnostico"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-medium transition-colors hover:text-primary min-h-[44px] flex items-center ${
                location === "/diagnostico"
                  ? "text-primary font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
              data-testid="nav-link-diagnostico-mobile"
            >
              {t("nav.diagnostico")}
            </WouterLink>
            <WouterLink
              href="/casos-conceptuales"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-medium transition-colors hover:text-primary min-h-[44px] flex items-center ${
                location.startsWith("/casos-conceptuales")
                  ? "text-primary font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
              data-testid="nav-link-casos-mobile"
            >
              {t("nav.casos")}
            </WouterLink>
            <Button
              onClick={() => scrollTo("#contacto")}
              className="bg-primary-solid w-full h-12 text-base font-semibold text-white mt-1 cursor-pointer"
            >
              {t("nav.contactar")}
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
