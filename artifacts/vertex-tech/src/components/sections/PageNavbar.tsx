import { Link } from "wouter";
import { useLanguage } from "@/context/LanguageContext";

export function PageNavbar() {
  const { lang, setLang } = useLanguage();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
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
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            data-testid="nav-back-home"
          >
            {lang === "es" ? "Volver al inicio" : "Back to home"}
          </Link>

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
        </div>
      </div>
    </nav>
  );
}
