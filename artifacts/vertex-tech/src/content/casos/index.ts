import type { ComponentType } from "react";

// ── Registro estático de Casos Conceptuales ──────────────────────────────────
//
// Cada caso es un archivo .mdx en esta carpeta. El CRUD se gestiona con
// archivos, sin base de datos:
//
//   CREAR    → añade un archivo .mdx (con su `export const meta`)
//   EDITAR   → edita el .mdx correspondiente
//   ELIMINAR → borra el archivo
//   LISTAR   → automático: este módulo lee la carpeta con import.meta.glob
//
// Las imágenes y videos-assets viven en public/images/casos/<slug>/.
// El listado se ordena por fecha descendente (la más nueva primero).

export interface CasoMeta {
  title: string;
  excerpt: string;
  /** Seudónimo con el que firma la empresa del ejemplo */
  pseudonym: string;
  /** Etiquetas temáticas del caso (opcional) */
  tags?: string[];
  /** Fecha ISO (yyyy-mm-dd) usada para ordenar el listado */
  date: string;
  /** Portada bajo /public (ej. /images/casos/x/portada.jpg) */
  cover: string;
}

export interface CasoEntry extends CasoMeta {
  slug: string;
  Component: ComponentType;
}

interface MdxModule {
  meta: CasoMeta;
  default: ComponentType;
}

const modules = import.meta.glob<MdxModule>("./*.mdx", { eager: true });

function slugFromPath(path: string): string {
  const file = path.split("/").pop() ?? "";
  return file.replace(/\.mdx$/, "");
}

export const casos: CasoEntry[] = Object.entries(modules)
  .map(([path, mod]) => ({
    slug: slugFromPath(path),
    ...mod.meta,
    Component: mod.default,
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

export function getCasoBySlug(slug: string): CasoEntry | undefined {
  return casos.find((c) => c.slug === slug);
}
