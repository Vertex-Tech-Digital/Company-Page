// Editor de texto enriquecido para el panel de administración.
// Basado en TipTap v3 + extensiones seleccionadas del starter-kit.
// Genera y recibe contenido en formato JSON (TipTap Document).
// El componente padre (AdminPosts) serializa el JSON a string antes de enviarlo
// a la API, y lo deserializa al cargar un post existente.

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Link as LinkIcon,
  Undo,
  Redo,
  Minus,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  // Contenido inicial como objeto JSON de TipTap (o null para editor vacío)
  value: object | null;
  onChange: (json: object) => void;
  placeholder?: string;
  disabled?: boolean;
}

// ── Botón de la barra de herramientas ─────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors text-sm
        ${active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:text-white hover:bg-white/5"
        }
        ${disabled ? "opacity-30 cursor-not-allowed" : ""}
      `}
    >
      {children}
    </button>
  );
}

// ── Separador de secciones en la toolbar ──────────────────────────────────────

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-border mx-1 shrink-0" />;
}

// ── Componente principal ───────────────────────────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Escribe el contenido del artículo aquí...",
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desactivamos los que gestionamos por separado
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    content: value ?? "",
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[280px] px-4 py-3 focus:outline-none " +
          "prose-headings:text-white prose-headings:font-bold " +
          "prose-p:text-muted-foreground prose-p:leading-relaxed " +
          "prose-strong:text-white prose-em:text-muted-foreground " +
          "prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded " +
          "prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground " +
          "prose-ul:text-muted-foreground prose-ol:text-muted-foreground " +
          "prose-a:text-primary prose-hr:border-border",
      },
    },
  });

  // Sincronizar contenido externo (cuando se carga un post para editar)
  useEffect(() => {
    if (!editor) return;
    // Solo actualizar si el contenido difiere del actual para evitar bucles
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value ?? "");
    if (current !== incoming && value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Actualizar editable cuando cambia disabled
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return null;

  // Gestión de links
  function handleSetLink() {
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL del enlace:", previousUrl);
    if (url === null) return; // cancelado
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const charCount = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div
      className={`rounded-lg border ${
        disabled ? "border-border/40 opacity-60" : "border-border focus-within:border-primary/50"
      } bg-background transition-colors overflow-hidden`}
    >
      {/* ── Barra de herramientas ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-card/30">

        {/* Deshacer / Rehacer */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Deshacer"
        >
          <Undo className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rehacer"
        >
          <Redo className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Encabezados */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Título H2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Subtítulo H3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Formato de texto */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Negrita"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Cursiva"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Subrayado"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Tachado"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          title="Resaltado"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Código inline"
        >
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Alineación */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Alinear izquierda"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Centrar"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Alinear derecha"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Lista de puntos"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Bloques especiales */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Cita"
        >
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Línea divisoria"
        >
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleSetLink}
          active={editor.isActive("link")}
          title="Insertar enlace"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      {/* ── Área de escritura ──────────────────────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* ── Contador de palabras / caracteres ─────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 px-4 py-1.5 border-t border-border/50 bg-card/20">
        <span className="text-xs text-muted-foreground/60">
          {wordCount} {wordCount === 1 ? "palabra" : "palabras"}
        </span>
        <span className="text-xs text-muted-foreground/40">·</span>
        <span className="text-xs text-muted-foreground/60">
          {charCount} {charCount === 1 ? "carácter" : "caracteres"}
        </span>
      </div>
    </div>
  );
}
