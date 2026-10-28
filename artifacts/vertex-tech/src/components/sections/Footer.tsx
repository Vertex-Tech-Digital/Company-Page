import { Link as WouterLink } from "wouter";
import { Github, Mail, MapPin, ArrowUp } from "lucide-react";
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
    <footer className="border-t border-white/10 bg-slate-950/90 backdrop-blur-md pt-16 pb-10 relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Col 1: Brand & Location */}
          <div className="space-y-4">
            <div
              className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5"
              data-testid="footer-logo"
            >
              <img
                src="/logo-88.webp"
                alt="Vertex Tech"
                width="28"
                height="28"
                className="w-7 h-7 object-contain rounded-lg"
              />
              <span>Vertex Tech</span>
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <MapPin
                className="w-3.5 h-3.5 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>{t("footer.location")}</span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white mb-4">
              {t("footer.services.title")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#servicios"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("#servicios");
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t("services.0.title")}
                </a>
              </li>
              <li>
                <a
                  href="#servicios"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("#servicios");
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t("services.1.title")}
                </a>
              </li>
              <li>
                <a
                  href="#servicios"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("#servicios");
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t("services.2.title")}
                </a>
              </li>
              <li>
                <WouterLink
                  href="/diagnostico"
                  className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Diagnóstico Técnico Gratuito</span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    IA
                  </span>
                </WouterLink>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Navigation */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white mb-4">
              {t("footer.company.title")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#metodologia"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("#metodologia");
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t("nav.metodologia")}
                </a>
              </li>
              <li>
                <WouterLink
                  href="/casos-conceptuales"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {t("nav.casos")}
                </WouterLink>
              </li>
              <li>
                <a
                  href="#contacto"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("#contacto");
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {t("nav.contactar")}
                </a>
              </li>
              <li>
                <WouterLink
                  href="/aviso-legal"
                  className="text-slate-400 hover:text-white transition-colors"
                  data-testid="footer-legal"
                >
                  {t("footer.legal")}
                </WouterLink>
              </li>
              <li>
                <WouterLink
                  href="/privacidad"
                  className="text-slate-400 hover:text-white transition-colors"
                  data-testid="footer-privacy"
                >
                  {t("footer.privacy")}
                </WouterLink>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Social */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-white mb-4">
              {t("footer.contact.title")}
            </h3>
            <div className="space-y-3.5 text-sm">
              <a
                href="mailto:contact@vertextech.dev"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <Mail
                  className="w-4 h-4 text-primary group-hover:scale-110 transition-transform"
                  aria-hidden="true"
                />
                <span>contact@vertextech.dev</span>
              </a>
              <a
                href="https://github.com/Vertex-Tech-Digital"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                data-testid="footer-github"
              >
                <Github
                  className="w-4 h-4 text-primary group-hover:scale-110 transition-transform"
                  aria-hidden="true"
                />
                <span>{t("footer.github")}</span>
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <WouterLink
                  href="/terminos"
                  className="text-slate-400 hover:text-white transition-colors"
                  data-testid="footer-terms"
                >
                  {t("footer.terms")}
                </WouterLink>
                <WouterLink
                  href="/cookies"
                  className="text-slate-400 hover:text-white transition-colors"
                  data-testid="footer-cookies"
                >
                  {t("footer.cookies")}
                </WouterLink>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("open-cookie-preferences"),
                    )
                  }
                  className="cursor-pointer text-xs text-primary hover:text-blue-300 transition-colors underline-offset-2 hover:underline"
                  data-testid="footer-cookie-settings"
                >
                  {t("footer.cookies.settings")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p className="order-2 sm:order-1">
            &copy; {new Date().getFullYear()} {t("footer.copyright")}
          </p>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t("footer.backToTop")}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors order-1 sm:order-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1"
          >
            <span>{t("footer.backToTop")}</span>
            <ArrowUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
