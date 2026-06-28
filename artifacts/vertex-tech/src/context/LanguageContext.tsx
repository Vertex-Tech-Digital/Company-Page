import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "es" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Nav
    "nav.inicio": "Inicio",
    "nav.servicios": "Servicios",
    "nav.proyectos": "Proyectos",
    "nav.metodologia": "Metodología",
    "nav.blog": "Blog",
    "nav.contactar": "Contactar",
    // Hero
    "hero.subheadline": "Consultoría tecnológica y soluciones a medida: automatizamos procesos, integramos sistemas y auditamos tu software para que tu empresa funcione más rápido, con menos errores y a menor coste.",
    "hero.cta.primary": "Solicitar consulta",
    "hero.cta.secondary": "Ver proyectos",
    // Services
    "services.title": "Servicios de Consultoría y Desarrollo Tecnológico",
    "services.0.title": "Aplicaciones Web a Medida y Optimización de Procesos (SaaS)",
    "services.0.desc": "Desarrollamos web adaptadas a la escala de tu negocio. Desde sitios corporativos y páginas de aterrizaje optimizadas para captar clientes, hasta plataformas internas complejas para gestionar ventas, personal, automatización de flujos y paneles de control inteligentes según las necesidades específicas de tu empresa.",
    "services.1.title": "Desarrollo y Conexión de APIs (Integración de Sistemas)",
    "services.1.desc": "Conectamos tus sistemas con cualquier servicio de terceros de forma segura. Desarrollamos arquitecturas de API eficientes con Node.js y NestJS, permitiendo la sincronización de datos en tiempo real, pasarelas de pago y automatizaciones.",
    "services.2.title": "Ingeniería de Calidad, QA & Testing",
    "services.2.desc": "Protegemos la estabilidad de tu software. Implementamos ciclos rigurosos de control de calidad, pruebas automatizadas y auditorías de código antes del despliegue para asegurar que tu plataforma funcione sin errores desde el primer día.",
    "services.3.title": "Automatización Inteligente e Integración de Procesos (IA)",
    "services.3.desc": "Optimizamos las operaciones de tu empresa eliminando tareas manuales repetitivas. Diseñamos e integramos flujos de trabajo automatizados, conectores de APIs avanzados, pasarelas de pago seguras (Stripe/Bizum), sistemas de mensajería automatizada por WhatsApp y soluciones de Inteligencia Artificial para reducir costes y multiplicar la eficiencia de tu equipo.",
    // Projects
    "projects.title": "Proyectos Destacados",
    "projects.subtitle": "Una muestra del tipo de soluciones de software que desarrollamos y auditamos para nuestros clientes",
    "projects.0.title": "Plataformas de Gestión Empresarial y RRHH (SaaS)",
    "projects.0.desc": "Desarrollo de ecosistemas internos en la nube para la administración masiva de activos y personal con arquitectura reactiva.",
    "projects.1.title": "Dashboards y Analítica en Tiempo Real",
    "projects.1.desc": "Paneles de control optimizados para el procesamiento de datos a gran escala y visualización de métricas críticas de negocio.",
    "projects.2.title": "Automatización e Integración de Sistemas",
    "projects.2.desc": "Migración de software heredado a infraestructuras API modernas y adaptadas para entornos móviles.",
    // Methodology
    "methodology.title": "Nuestra Metodología",
    "methodology.desc": "En Vertex Tech trabajamos con una metodología ágil orientada a resultados. Dividimos cada proyecto en etapas claras, priorizamos comunicación constante, control de calidad riguroso y entregas puntuales. Nuestro objetivo no es solo construir software, sino crear soluciones estables, mantenibles y preparadas para escalar.",
    "methodology.0.title": "Análisis y Estrategia",
    "methodology.0.desc": "Definición de requisitos y diseño de la arquitectura técnica.",
    "methodology.1.title": "Desarrollo Ágil por Hitos",
    "methodology.1.desc": "Entregas funcionales constantes y código revisado en GitHub.",
    "methodology.2.title": "Control de Calidad Riguroso",
    "methodology.2.desc": "Pruebas integrales (QA Testing) para garantizar robustez.",
    "methodology.3.title": "Despliegue Continuo y Soporte",
    "methodology.3.desc": "Subida a la nube en servidores optimizados y mantenimiento técnico.",
    // WhyUs
    "whyus.title": "¿Por qué Vertex Tech?",
    "whyus.0": "Código auditable y sin sorpresas",
    "whyus.1": "Comunicación clara",
    "whyus.2": "Ingeniería sólida de principio a fin",
    "whyus.3": "Soluciones que crecen con tu empresa",
    "whyus.4": "Diseño moderno y profesional",
    // Contact
    "contact.title": "¿Hablamos de tu próximo",
    "contact.titleHighlight": "proyecto?",
    "contact.subtitle": "Cuéntanos qué necesitamos y te ayudamos a diseñar e implementar la solución tecnológica a medida que tu empresa requiere.",
    "contact.label.name": "Nombre",
    "contact.label.email": "Email",
    "contact.label.company": "Empresa (Opcional)",
    "contact.label.message": "Mensaje",
    "contact.placeholder.name": "Tu nombre",
    "contact.placeholder.company": "Nombre de tu empresa",
    "contact.placeholder.message": "Cuéntanos sobre tu proyecto...",
    "contact.submit": "Enviar solicitud",
    "contact.submitting": "Enviando...",
    "contact.success.title": "¡Solicitud enviada!",
    "contact.success.desc": "Nos pondremos en contacto contigo a la brevedad.",
    "contact.success.another": "Enviar otro mensaje",
    "contact.error.name": "El nombre es requerido",
    "contact.error.email": "Email inválido",
    "contact.error.message": "El mensaje debe tener al menos 10 caracteres",
    "contact.error.server": "Error al enviar el mensaje",
    // Footer
    "footer.tagline": "Desarrollo Fullstack para empresas modernas.",
    "footer.copyright": "2026 Vertex Tech Digital. Todos los derechos reservados.",
    "footer.legal": "Aviso Legal",
    "footer.privacy": "Política de Privacidad",
    "footer.cookies": "Cookies",
    "footer.github": "GitHub",
    "footer.legal.title": "Aviso Legal",
    "footer.legal.body": "En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE), se informa que este sitio web es una plataforma de presentación comercial operada provisionalmente por su fundador, Sandy Brito Hernández, con identificación fiscal Y8259024Z y residencia en Tenerife, Canarias, España. Para cualquier consulta o comunicación, puede dirigirse al correo electrónico oficial de contacto: vertextechcontact@gmail.com.",
    "footer.privacy.title": "Política de Privacidad",
    "footer.privacy.body": "De conformidad con el Reglamento General de Protección de Datos (RGPD), le informamos que los datos personales facilitados a través de nuestro formulario de contacto serán tratados con la única finalidad de responder a sus solicitudes de información o presupuesto de servicios tecnológicos y QA. Sus datos no serán cedidos a terceros bajo ningún concepto. Puede ejercer sus derechos de acceso, rectificación o eliminación escribiendo a: vertextechcontact@gmail.com.",
    "footer.cookies.title": "Política de Cookies",
    "footer.cookies.body": "Esta web ha sido diseñada bajo principios de privacidad y rendimiento técnico. No utilizamos cookies de rastreo, analítica o marketing. Únicamente se emplean cookies técnicas esenciales para garantizar una navegación fluida y segura por el sitio.",
    "footer.close": "Cerrar",
    // WhatsApp
    "whatsapp.cta": "Contáctanos por WhatsApp",
    "whatsapp.aria": "Contactar por WhatsApp",
    "whatsapp.message": "Hola, me gustaría obtener más información sobre sus servicios.",
  },
  en: {
    // Nav
    "nav.inicio": "Home",
    "nav.servicios": "Services",
    "nav.proyectos": "Projects",
    "nav.metodologia": "Methodology",
    "nav.blog": "Blog",
    "nav.contactar": "Contact",
    // Hero
    "hero.subheadline": "Technology consulting and custom solutions: we automate your processes, integrate your systems and audit your software — so your business runs faster, with fewer errors and at lower cost.",
    "hero.cta.primary": "Request a consultation",
    "hero.cta.secondary": "View projects",
    // Services
    "services.title": "Technology Consulting & Development Services",
    "services.0.title": "Custom Web Applications & Process Optimization (SaaS)",
    "services.0.desc": "We don't build static websites; we design and develop powerful business software that runs through the internet. We build everything from internal platforms to manage your clients, sales, and staff in real time, to intelligent dashboards to automate your company's processes.",
    "services.1.title": "High-Performance APIs & Systems Integration",
    "services.1.desc": "We connect your systems with any third-party service securely. We develop efficient API architectures with Node.js and NestJS, enabling real-time data synchronization, payment gateways, and automations.",
    "services.2.title": "Quality Engineering, QA & Testing",
    "services.2.desc": "We protect the stability of your software. We implement rigorous quality control cycles, automated testing, and code audits before deployment to ensure your platform works flawlessly from day one.",
    "services.3.title": "Smart Automation & AI Process Integration",
    "services.3.desc": "We optimize your company's operations by eliminating repetitive manual tasks. We design and integrate automated workflows, advanced API connectors, secure payment gateways (Stripe/Bizum), automated WhatsApp messaging systems, and Artificial Intelligence solutions to reduce costs and multiply your team's efficiency.",
    // Projects
    "projects.title": "Featured Projects",
    "projects.subtitle": "A sample of the software solutions we develop and audit for our clients",
    "projects.0.title": "Enterprise Management & HR Platforms (SaaS)",
    "projects.0.desc": "Development of cloud-based internal ecosystems for large-scale asset and personnel management with reactive architecture.",
    "projects.1.title": "Real-Time Dashboards & Analytics",
    "projects.1.desc": "Control panels optimized for large-scale data processing and critical business metrics visualization.",
    "projects.2.title": "Systems Automation & Integration",
    "projects.2.desc": "Migration of legacy software to modern API infrastructures adapted for mobile environments.",
    // Methodology
    "methodology.title": "Our Methodology",
    "methodology.desc": "At Vertex Tech we work with an agile, results-oriented methodology. We divide each project into clear stages, prioritize constant communication, rigorous quality control, and on-time deliveries. Our goal is not just to build software, but to create stable, maintainable, and scalable solutions.",
    "methodology.0.title": "Analysis & Strategy",
    "methodology.0.desc": "Requirements definition and technical architecture design.",
    "methodology.1.title": "Agile Milestone Development",
    "methodology.1.desc": "Constant functional deliveries and code reviewed on GitHub.",
    "methodology.2.title": "Rigorous Quality Control",
    "methodology.2.desc": "Comprehensive testing (QA Testing) to ensure robustness.",
    "methodology.3.title": "Continuous Deployment & Support",
    "methodology.3.desc": "Cloud deployment on optimized servers and ongoing technical maintenance.",
    // WhyUs
    "whyus.title": "Why Vertex Tech?",
    "whyus.0": "Auditable code, no surprises",
    "whyus.1": "Clear communication",
    "whyus.2": "Solid engineering from start to finish",
    "whyus.3": "Solutions that grow with your business",
    "whyus.4": "Modern and professional design",
    // Contact
    "contact.title": "Shall we talk about your next",
    "contact.titleHighlight": "project?",
    "contact.subtitle": "Tell us what you need and we'll help you design and implement the custom tech solution your business deserves.",
    "contact.label.name": "Name",
    "contact.label.email": "Email",
    "contact.label.company": "Company (Optional)",
    "contact.label.message": "Message",
    "contact.placeholder.name": "Your name",
    "contact.placeholder.company": "Your company name",
    "contact.placeholder.message": "Tell us about your project...",
    "contact.submit": "Send request",
    "contact.submitting": "Sending...",
    "contact.success.title": "Request sent!",
    "contact.success.desc": "We'll get back to you shortly.",
    "contact.success.another": "Send another message",
    "contact.error.name": "Name is required",
    "contact.error.email": "Invalid email",
    "contact.error.message": "Message must be at least 10 characters",
    "contact.error.server": "Error sending message",
    // Footer
    "footer.tagline": "Fullstack development for modern enterprises.",
    "footer.copyright": "2026 Vertex Tech Digital. All rights reserved.",
    "footer.legal": "Legal Notice",
    "footer.privacy": "Privacy Policy",
    "footer.cookies": "Cookies",
    "footer.github": "GitHub",
    "footer.legal.title": "Legal Notice",
    "footer.legal.body": "In compliance with Article 10 of Law 34/2002 (LSSI-CE), please be advised that this website is a commercial presentation platform provisionally operated by its founder, Sandy Brito Hernández, with tax identification number Y8259024Z, residing in Tenerife, Canary Islands, Spain. For any inquiries, please reach out to our official contact email: vertextechcontact@gmail.com.",
    "footer.privacy.title": "Privacy Policy",
    "footer.privacy.body": "In accordance with the General Data Protection Regulation (GDPR), we inform you that any personal data provided through our contact form will be processed solely to respond to your requests for information or service quotes. Your data will never be shared with third parties. You may exercise your rights to access, rectify, or delete your data by contacting us at: vertextechcontact@gmail.com.",
    "footer.cookies.title": "Cookie Policy",
    "footer.cookies.body": "This website has been designed under principles of privacy and technical performance. We do not use tracking, analytics, or marketing cookies. Only essential technical cookies are used to ensure smooth and secure navigation throughout the site.",
    "footer.close": "Close",
    // WhatsApp
    "whatsapp.cta": "Contact us on WhatsApp",
    "whatsapp.aria": "Contact via WhatsApp",
    "whatsapp.message": "Hello, I'd like to get more information about your services.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("es");

  useEffect(() => {
    const savedLang = localStorage.getItem("vertex-tech-lang") as Language;
    if (savedLang === "es" || savedLang === "en") setLangState(savedLang);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("vertex-tech-lang", newLang);
  };

  const t = (key: string): string => translations[lang][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}
