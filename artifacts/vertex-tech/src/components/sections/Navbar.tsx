import { useState, useEffect } from "react";
import { Link as WouterLink, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
      setIsScrolled(window.scrollY > 50);

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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        // Sin backdrop-blur por debajo de md (768px): este navbar queda fijo
        // sobre el canvas de ParticleNetwork, que se redibuja 60x/seg. El
        // backdrop-filter tiene que re-muestrear ese fondo en cada frame, así
        // que en pantallas chicas se cambia por un fondo sólido (sin blur).
        isScrolled
          ? "bg-background/95 md:bg-background/80 md:backdrop-blur-md border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
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
            src="/logo.jpg"
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
              Consultora Tecnológica
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
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/" && activeSection === link.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              data-testid={`nav-link-${link.id}`}
            >
              {t(`nav.${link.id}`)}
            </a>
          ))}

          <WouterLink
            href="/diagnostico"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location === "/diagnostico"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            data-testid="nav-link-diagnostico"
          >
            {t("nav.diagnostico")}
          </WouterLink>

          <WouterLink
            href="/casos-conceptuales"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.startsWith("/casos-conceptuales")
                ? "text-primary"
                : "text-muted-foreground"
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
              className={`${lang === "es" ? "text-white font-semibold" : "text-muted-foreground hover:text-white"}`}
              data-testid="lang-toggle-es"
            >
              ES
            </button>
            <span className="text-muted-foreground/50">|</span>
            <button
              onClick={() => setLang("en")}
              className={`${lang === "en" ? "text-white font-semibold" : "text-muted-foreground hover:text-white"}`}
              data-testid="lang-toggle-en"
            >
              EN
            </button>
          </div>

          <Button
            onClick={() => scrollTo("#contacto")}
            className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            data-testid="nav-cta"
          >
            {t("nav.contactar")}
          </Button>
        </div>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="nav-mobile-toggle"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 w-full bg-background/95 backdrop-blur-lg border-b border-border p-6 flex flex-col gap-6 md:hidden"
            data-testid="nav-mobile-menu"
          >
            <div className="flex justify-end gap-2 text-sm tracking-widest uppercase mb-2">
              <button
                onClick={() => setLang("es")}
                className={`${lang === "es" ? "text-white font-semibold" : "text-muted-foreground"}`}
              >
                ES
              </button>
              <span className="text-muted-foreground/50">|</span>
              <button
                onClick={() => setLang("en")}
                className={`${lang === "en" ? "text-white font-semibold" : "text-muted-foreground"}`}
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
                className={`text-lg font-medium transition-colors ${
                  location === "/" && activeSection === link.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {t(`nav.${link.id}`)}
              </a>
            ))}

            <WouterLink
              href="/diagnostico"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-medium transition-colors hover:text-primary ${
                location === "/diagnostico"
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              data-testid="nav-link-diagnostico-mobile"
            >
              {t("nav.diagnostico")}
            </WouterLink>
            <WouterLink
              href="/casos-conceptuales"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-medium transition-colors hover:text-primary ${
                location.startsWith("/casos-conceptuales")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
              data-testid="nav-link-casos-mobile"
            >
              {t("nav.casos")}
            </WouterLink>
            {/* TODO: Reactivar cuando el blog esté listo (actualmente en desarrollo)
            <WouterLink
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              data-testid="nav-link-blog-mobile"
            >
              {t("nav.blog")}
            </WouterLink>
            */}
            <Button
              onClick={() => scrollTo("#contacto")}
              className="bg-primary w-full text-white"
            >
              {t("nav.contactar")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
