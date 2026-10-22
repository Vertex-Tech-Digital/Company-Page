// Declaración de tipos para los archivos MDX de los casos conceptuales.
// Cada .mdx exporta su metadata en `meta` y el contenido como componente default.

declare module "*.mdx" {
  import type { ComponentType } from "react";

  export interface CasoMdxMeta {
    title: string;
    excerpt: string;
    pseudonym: string;
    /** Fecha ISO (yyyy-mm-dd) usada para ordenar el listado */
    date: string;
    /** Ruta de la imagen de portada bajo /public (ej. /images/casos/x/portada.jpg) */
    cover: string;
  }

  export const meta: CasoMdxMeta;
  const Content: ComponentType;
  export default Content;
}
