import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "es" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    "nav.inicio": "Inicio",
    "nav.servicios": "Servicios",
    "nav.proyectos": "Proyectos",
    "nav.metodologia": "Metodología",
    "nav.contactar": "Contactar",
    "hero.headline": "Transformamos ideas en aplicaciones web de alto rendimiento",
    "hero.subheadline": "Desarrollo Fullstack, APIs e integración de sistemas con React, Next.js y Node.js para empresas que buscan velocidad, escalabilidad y calidad técnica.",
    "hero.cta.primary": "Solicitar consulta",
    "hero.cta.secondary": "Ver proyectos",
    "footer.tagline": "Desarrollo Fullstack para empresas modernas.",
    "footer.copyright": "2026 Vertex Tech. Todos los derechos reservados.",
  },
  en: {
    "nav.inicio": "Home",
    "nav.servicios": "Services",
    "nav.proyectos": "Projects",
    "nav.metodologia": "Methodology",
    "nav.contactar": "Contact",
    "hero.headline": "We transform ideas into high-performance web applications",
    "hero.subheadline": "Fullstack Development, APIs, and systems integration with React, Next.js, and Node.js for companies that demand speed, scalability, and technical excellence.",
    "hero.cta.primary": "Request a consultation",
    "hero.cta.secondary": "View projects",
    "footer.tagline": "Fullstack development for modern enterprises.",
    "footer.copyright": "2026 Vertex Tech. All rights reserved.",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("es");

  useEffect(() => {
    const savedLang = localStorage.getItem("vertex-tech-lang") as Language;
    if (savedLang === "es" || savedLang === "en") {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("vertex-tech-lang", newLang);
  };

  const t = (key: string): string => {
    // @ts-ignore
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
