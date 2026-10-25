import { Link as WouterLink } from "wouter";
import { Github } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/${href}`;
    }
  };

  const legalLinks = [
    { href: "/aviso-legal", label: t("footer.legal"), testId: "footer-legal" },
    {
      href: "/privacidad",
      label: t("footer.privacy"),
      testId: "footer-privacy",
    },
    { href: "/terminos", label: t("footer.terms"), testId: "footer-terms" },
    { href: "/cookies", label: t("footer.cookies"), testId: "footer-cookies" },
  ];

  return (
    <footer className="border-t border-border bg-background pt-14 pb-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
          {/* Brand */}
          <div className="max-w-xs">
            <div
              className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-3"
              data-testid="footer-logo"
            >
              Vertex Tech
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap gap-6">
            {/* TODO: Reactivar cuando el blog esté listo (actualmente en desarrollo)
            <WouterLink
              href="/blog"
              className="cursor-pointer text-sm text-muted-foreground hover:text-white transition-colors"
              data-testid="footer-link-blog"
            >
              {t("nav.blog")}
            </WouterLink>
            */}
            {[
              { href: "#servicios", label: t("nav.servicios") },
              // { href: "#proyectos", label: t("nav.proyectos") }, // oculto temporalmente
              { href: "#metodologia", label: t("nav.metodologia") },
              { href: "#contacto", label: t("nav.contactar") },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(href);
                }}
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

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 order-1 sm:order-2">
            {legalLinks.map(({ href, label, testId }) => (
              <WouterLink
                key={href}
                href={href}
                className="cursor-pointer text-xs text-muted-foreground hover:text-white transition-colors underline-offset-2 hover:underline"
                data-testid={testId}
              >
                {label}
              </WouterLink>
            ))}
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-cookie-preferences"))
              }
              className="cursor-pointer text-xs text-primary/80 hover:text-primary transition-colors underline-offset-2 hover:underline"
              data-testid="footer-cookie-settings"
            >
              {t("footer.cookies.settings")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
