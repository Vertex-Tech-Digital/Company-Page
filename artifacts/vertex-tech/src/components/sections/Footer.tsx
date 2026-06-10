import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border bg-background pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="max-w-xs">
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-4" data-testid="footer-logo">
              Vertex Tech<span className="w-2 h-2 rounded-full bg-primary"></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>
          
          <div className="flex gap-8">
            <a href="#servicios" onClick={(e) => { e.preventDefault(); scrollTo("#servicios"); }} className="text-sm text-muted-foreground hover:text-white transition-colors" data-testid="footer-link-servicios">
              {t("nav.servicios")}
            </a>
            <a href="#proyectos" onClick={(e) => { e.preventDefault(); scrollTo("#proyectos"); }} className="text-sm text-muted-foreground hover:text-white transition-colors" data-testid="footer-link-proyectos">
              {t("nav.proyectos")}
            </a>
            <a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo("#contacto"); }} className="text-sm text-muted-foreground hover:text-white transition-colors" data-testid="footer-link-contacto">
              {t("nav.contactar")}
            </a>
          </div>
        </div>
        
        <div className="border-t border-border/50 pt-8 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
