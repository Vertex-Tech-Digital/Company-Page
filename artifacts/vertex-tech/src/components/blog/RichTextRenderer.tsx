// Renderizador de solo lectura para contenido TipTap JSON.
// Usado en BlogPost.tsx para mostrar el cuerpo de los artículos.
//
// Compatibilidad con contenido heredado:
// Los posts creados antes de TipTap tienen content como texto plano.
// Este componente detecta automáticamente si el contenido es JSON (TipTap)
// o texto plano y lo renderiza correctamente en ambos casos.

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { parseTiptapContent } from "@/lib/tiptap-content";

interface RichTextRendererProps {
  content: string; // String JSON de TipTap, o texto plano (posts heredados)
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  const parsedContent = parseTiptapContent(content);

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

  // useEditor solo usa `content` para el estado inicial — no se re-sincroniza
  // solo cuando la prop cambia (ej. al cambiar de idioma). Sin esto, título y
  // resumen cambian de idioma pero el cuerpo del artículo se queda en el
  // idioma con el que se montó el componente hasta recargar la página.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = parseTiptapContent(content);
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(next)) {
      editor.commands.setContent(next);
    }
  }, [content, editor]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
