// Utilidades compartidas para interpretar el campo `content` de un post.
//
// El campo se guarda como texto en la base de datos y puede contener:
//   - JSON de un documento TipTap (posts creados/editados con el editor actual)
//   - Texto plano heredado (posts creados antes de introducir TipTap)
//
// Usado tanto por el editor del panel admin (AdminPosts.tsx) como por el
// renderizador público de solo lectura (RichTextRenderer.tsx), para que
// ambos interpreten el contenido heredado de la misma forma.

// Intenta parsear el content como JSON de TipTap.
// Si falla (texto plano), convierte los párrafos en un documento TipTap válido.
export function parseTiptapContent(raw: string): object {
  if (!raw || raw.trim() === "") {
    return { type: "doc", content: [] };
  }

  // Intentar parsear como JSON de TipTap
  try {
    const parsed = JSON.parse(raw);
    // Verificar que tiene la estructura mínima de un documento TipTap
    if (parsed && parsed.type === "doc" && Array.isArray(parsed.content)) {
      return parsed;
    }
  } catch {
    // No es JSON — es texto plano (post heredado)
  }

  // Convertir texto plano: cada bloque separado por línea en blanco = párrafo
  const paragraphs = raw
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    }));

  return {
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [],
  };
}

// Un documento TipTap "vacío" (ej. tras borrar todo el texto) sigue siendo
// un objeto/string no-null como '{"type":"doc","content":[]}' — truthy en
// JS aunque no tenga contenido real. Esta función recorre el árbol y
// confirma si hay al menos un nodo de texto no vacío, para no confundir
// "documento vacío" con "hay traducción".
export function hasRichTextContent(
  value: string | object | null | undefined,
): boolean {
  if (!value) return false;

  let doc: unknown = value;
  if (typeof value === "string") {
    if (value.trim() === "") return false;
    try {
      doc = JSON.parse(value);
    } catch {
      // No es JSON — texto plano heredado. Si llegó hasta aquí ya sabemos
      // que no está vacío (el trim de arriba lo habría descartado).
      return true;
    }
  }

  return nodeHasText(doc);
}

function nodeHasText(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const n = node as { type?: string; text?: string; content?: unknown };
  if (n.type === "text" && typeof n.text === "string" && n.text.trim() !== "") {
    return true;
  }
  if (Array.isArray(n.content)) {
    return n.content.some(nodeHasText);
  }
  return false;
}
