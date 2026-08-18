/**
 * Configuración central del sitio del cliente.
 *
 * ÚNICO archivo que hay que tocar para personalizar la mayoría del contenido de
 * marca en un proyecto nuevo. Cámbialo al hacer onboarding de un cliente.
 */
export interface SiteConfig {
  /** Nombre comercial del cliente. */
  brandName: string;
  /** Eslogan corto para el hero. */
  tagline: string;
  /** Descripción de una o dos frases. */
  description: string;
  /** Color principal de marca (hex). Se inyecta como --brand. */
  brandColor: string;
  /** Datos de contacto mostrados en el footer. */
  contact: {
    email: string;
    phone?: string;
  };
  /** Enlaces de navegación (ancla o ruta). */
  nav: { label: string; href: string }[];
  /** Bloques de servicios/características del cliente. */
  features: { title: string; description: string }[];
}

export const siteConfig: SiteConfig = {
  brandName: "Cliente Demo",
  tagline: "Tu eslogan aquí",
  description:
    "Descripción breve del negocio del cliente. Edítala en src/lib/site-config.ts.",
  brandColor: "#2563eb",
  contact: {
    email: "hola@cliente-demo.com",
    phone: "+34 600 000 000",
  },
  nav: [
    { label: "Inicio", href: "#inicio" },
    { label: "Servicios", href: "#servicios" },
    { label: "Contacto", href: "#contacto" },
  ],
  features: [
    {
      title: "Servicio 1",
      description: "Describe aquí el primer servicio del cliente.",
    },
    {
      title: "Servicio 2",
      description: "Describe aquí el segundo servicio del cliente.",
    },
    {
      title: "Servicio 3",
      description: "Describe aquí el tercer servicio del cliente.",
    },
  ],
};
