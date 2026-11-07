import { Link as WouterLink } from "wouter";
import { Github, Mail, MapPin, ArrowUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";

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
    <footer className="border-t border-white/10 bg-slate-950/90 backdrop-blur-md pt-12 sm:pt-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] relative z-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-12 sm:mb-14">
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
                  href="/blog"
                  className="text-slate-400 hover:text-white transition-colors inline-block py-1"
                  data-testid="footer-blog"
                >
                  {t("nav.blog")}
                </WouterLink>
              </li>
              <li>
                <WouterLink
                  href="/casos-conceptuales"
                  className="text-slate-400 hover:text-white transition-colors inline-block py-1"
                  data-testid="footer-casos"
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
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  t("whatsapp.message"),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("whatsapp.aria")}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                data-testid="footer-whatsapp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 32 32"
                  className="w-4 h-4 fill-[#25D366] group-hover:scale-110 transition-transform"
                  aria-hidden="true"
                >
                  <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16.003c0 2.37.637 4.687 1.847 6.72L2.667 29.333l6.81-1.787a13.29 13.29 0 0 0 6.526 1.717h.006c7.363 0 13.324-5.97 13.324-13.337C29.333 8.637 23.366 2.667 16.003 2.667zm0 24.44a11.07 11.07 0 0 1-5.643-1.547l-.403-.24-4.04 1.06 1.08-3.94-.264-.41A11.07 11.07 0 0 1 4.89 16c0-6.123 4.986-11.107 11.113-11.107S27.11 9.88 27.11 16.003c0 6.12-4.984 11.104-11.107 11.104zm6.093-8.317c-.334-.167-1.977-.977-2.284-1.087-.306-.11-.53-.167-.753.167-.224.334-.863 1.087-1.06 1.31-.196.224-.39.25-.724.083-.334-.167-1.41-.52-2.686-1.657-.993-.887-1.663-1.98-1.857-2.314-.194-.334-.02-.514.146-.68.15-.15.334-.39.5-.584.167-.194.223-.334.334-.557.11-.224.056-.418-.028-.585-.083-.167-.753-1.814-1.033-2.484-.27-.65-.547-.563-.753-.574l-.64-.01c-.224 0-.585.083-.89.418-.307.334-1.17 1.143-1.17 2.787 0 1.644 1.197 3.23 1.363 3.454.167.224 2.353 3.59 5.703 5.034.797.344 1.42.55 1.904.704.8.254 1.53.218 2.104.132.642-.096 1.977-.807 2.256-1.587.28-.78.28-1.45.196-1.587-.083-.14-.307-.224-.64-.39z" />
                </svg>
                <span>{t("footer.whatsapp")}</span>
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <WouterLink
                  href="/terminos"
                  className="text-slate-400 hover:text-white transition-colors inline-block py-1"
                  data-testid="footer-terms"
                >
                  {t("footer.terms")}
                </WouterLink>
                <WouterLink
                  href="/cookies"
                  className="text-slate-400 hover:text-white transition-colors inline-block py-1"
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
                  className="cursor-pointer text-xs text-primary hover:text-blue-300 transition-colors underline-offset-2 hover:underline inline-block py-1"
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
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors order-1 sm:order-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2.5 py-2 min-h-[44px]"
          >
            <span>{t("footer.backToTop")}</span>
            <ArrowUp className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
