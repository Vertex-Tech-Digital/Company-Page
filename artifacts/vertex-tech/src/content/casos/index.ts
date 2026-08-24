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
// Bilingüe por convención de archivos:
//   <slug>.mdx      → español (canónico, sirve de fallback)
//   <slug>.en.mdx   → inglés (opcional)
//
// Las imágenes y videos-assets viven en public/images/casos/<slug>/.
// El listado se ordena por fecha descendente (la más nueva primero).
//
// Carga dinámica: cada .mdx se compila a su propio chunk y se descarga solo
// cuando se solicita (listado o detalle), no en el bundle inicial.

export type CaseLanguage = "es" | "en";

export interface CasoMeta {
  title: string;
  excerpt: string;
  /** Seudónimo con el que firma la empresa del ejemplo */
  pseudonym: string;
  /** Etiquetas temáticas del caso (opcional) */
  tags?: string[];
  /** Fecha ISO (yyyy-mm-dd) usada para ordenar el listado */
  date: string;
  /** Portada bajo /public (ej. /images/casos/x/portada.webp) */
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

interface LoadedFile {
  slug: string;
  lang: CaseLanguage;
  meta: CasoMeta;
  Component: ComponentType;
}

const modules = import.meta.glob<MdxModule>("./*.mdx");

function parsePath(path: string): { slug: string; lang: CaseLanguage } {
  const file = path.split("/").pop() ?? "";
  const isEnglish = file.endsWith(".en.mdx");
  const slug = file.replace(/\.en\.mdx$/, "").replace(/\.mdx$/, "");
  return { slug, lang: isEnglish ? "en" : "es" };
}

/** Puntuación de preferencia: idioma pedido > español > cualquier otro */
function score(lang: CaseLanguage, wanted: CaseLanguage): number {
  if (lang === wanted) return 2;
  if (lang === "es") return 1;
  return 0;
}

/**
 * Todos los casos, ordenados por fecha descendente, en el idioma pedido.
 * Si un caso no tiene traducción para `lang`, cae a la versión española.
 */
export async function getCasos(
  lang: CaseLanguage = "es",
): Promise<CasoEntry[]> {
  const loaded: LoadedFile[] = await Promise.all(
    Object.entries(modules).map(async ([path, load]) => {
      const { slug, lang: fileLang } = parsePath(path);
      const mod = await load();
      return { slug, lang: fileLang, meta: mod.meta, Component: mod.default };
    }),
  );

  const bestBySlug = new Map<string, LoadedFile>();
  for (const file of loaded) {
    const current = bestBySlug.get(file.slug);
    if (!current || score(file.lang, lang) > score(current.lang, lang)) {
      bestBySlug.set(file.slug, file);
    }
  }

  return [...bestBySlug.values()]
    .map(({ slug, meta, Component }) => ({ slug, ...meta, Component }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Un caso por slug en el idioma pedido (undefined si no existe).
 * Solo carga del disco los chunks necesarios para ese slug.
 */
export async function getCasoBySlug(
  slug: string,
  lang: CaseLanguage = "es",
): Promise<CasoEntry | undefined> {
  const candidates = Object.entries(modules).filter(
    ([path]) => parsePath(path).slug === slug,
  );
  if (candidates.length === 0) return undefined;

  for (const wanted of [lang, "es"] as CaseLanguage[]) {
    const match = candidates.find(([path]) => parsePath(path).lang === wanted);
    if (match) {
      const mod = await match[1]();
      return { slug, ...mod.meta, Component: mod.default };
    }
  }
  return undefined;
}
