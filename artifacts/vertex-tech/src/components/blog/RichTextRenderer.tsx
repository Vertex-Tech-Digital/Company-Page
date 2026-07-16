// Renderizador de solo lectura para contenido TipTap JSON.
// Usado en BlogPost.tsx para mostrar el cuerpo de los artículos.
//
// Compatibilidad con contenido heredado:
// Los posts creados antes de TipTap tienen content como texto plano.
// Este componente detecta automáticamente si el contenido es JSON (TipTap)
// o texto plano y lo renderiza correctamente en ambos casos.

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";

interface RichTextRendererProps {
  content: string; // String JSON de TipTap, o texto plano (posts heredados)
}

// Intenta parsear el content como JSON de TipTap.
// Si falla (texto plano), convierte los párrafos en un documento TipTap válido.
function parseContent(raw: string): object {
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

export function RichTextRenderer({ content }: RichTextRendererProps) {
  const parsedContent = parseContent(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-primary underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: parsedContent,
    editable: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-lg max-w-none " +
          "prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight " +
          "prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 " +
          "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 " +
          "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-5 " +
          "prose-strong:text-white prose-strong:font-semibold " +
          "prose-em:text-muted-foreground/80 " +
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline " +
          "prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm " +
          "prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-xl " +
          "prose-blockquote:border-l-2 prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground prose-blockquote:pl-4 prose-blockquote:italic " +
          "prose-ul:text-muted-foreground prose-ul:my-4 " +
          "prose-ol:text-muted-foreground prose-ol:my-4 " +
          "prose-li:my-1 " +
          "prose-hr:border-border prose-hr:my-8 " +
          "prose-mark:bg-primary/20 prose-mark:text-white prose-mark:rounded prose-mark:px-0.5",
      },
    },
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
