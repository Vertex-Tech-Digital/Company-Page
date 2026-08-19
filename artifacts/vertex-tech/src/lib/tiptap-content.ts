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
