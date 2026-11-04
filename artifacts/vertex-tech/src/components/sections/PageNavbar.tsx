import { Link, useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";

export function PageNavbar() {
  const { lang, setLang } = useLanguage();
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
          data-testid="nav-logo"
        >
          <img
            src="/logo-88.webp"
            srcSet="/logo-44.webp 1x, /logo-88.webp 2x, /logo-132.webp 3x"
            width={44}
            height={44}
            decoding="async"
            alt="Vertex Tech"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl object-cover transition-transform group-hover:scale-105 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]"
          />
          <div className="flex flex-col leading-none">
            <span
              className="text-base sm:text-lg font-bold tracking-widest uppercase text-white"
              style={{ fontFamily: "var(--app-font-heading)" }}
            >
              Vertex Tech
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.9)] ml-1 mb-0.5 align-middle"></span>
            </span>
            <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-primary/70 font-medium">
              Consultora Tecnológica
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-h-[44px] flex items-center"
            data-testid="nav-back-home"
          >
            <span className="hidden sm:inline">
              {lang === "es" ? "Volver al inicio" : "Back to home"}
            </span>
            <span className="sm:hidden">
              {lang === "es" ? "Inicio" : "Home"}
            </span>
          </Link>

          <Link
            href="/casos-conceptuales"
            className={`hidden sm:inline-block text-sm font-medium transition-colors hover:text-primary ${
              location.startsWith("/casos-conceptuales")
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            data-testid="nav-link-casos-page"
          >
            {lang === "es" ? "Casos Conceptuales" : "Conceptual Cases"}
          </Link>

          <div className="flex items-center gap-0.5 sm:gap-1 text-xs tracking-widest uppercase">
            <button
              onClick={() => setLang("es")}
              className={`min-h-[44px] min-w-[36px] flex items-center justify-center rounded px-1.5 py-1 ${lang === "es" ? "text-white font-semibold" : "text-muted-foreground hover:text-white"}`}
              data-testid="lang-toggle-es"
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
              className={`min-h-[44px] min-w-[36px] flex items-center justify-center rounded px-1.5 py-1 ${lang === "en" ? "text-white font-semibold" : "text-muted-foreground hover:text-white"}`}
              data-testid="lang-toggle-en"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
