import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Plus, Trash2, RefreshCw, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannedWord {
  id: number;
  word: string;
  created_at: string;
}

interface AdminBannedWordsProps {
  token: string;
}

export function AdminBannedWords({ token }: AdminBannedWordsProps) {
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Estado de edición inline: id de la palabra que se está editando y su valor temporal
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-banned-words", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWords(data.bannedWords);
    } catch {
      setError("No se pudieron cargar las palabras prohibidas");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Enfocar el input al entrar en modo edición
  useEffect(() => {
    if (editingId !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  function startEditing(word: BannedWord) {
    setEditingId(word.id);
    setEditingValue(word.word);
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingValue("");
  }

  // Editar = borrar la vieja + crear la nueva
  async function handleSaveEdit(id: number) {
    const trimmed = editingValue.trim().toLowerCase();
    const original = words.find((w) => w.id === id)?.word;

    if (!trimmed || trimmed === original) {
      cancelEditing();
      return;
    }

    setSavingEdit(true);
    setError(null);

    try {
      // 1. Eliminar la palabra original
      const delRes = await fetch(`/api/admin-banned-words?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!delRes.ok) throw new Error("No se pudo eliminar la palabra original");

      // 2. Insertar la nueva
      const addRes = await fetch("/api/admin-banned-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ word: trimmed }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) {
        setError(addData.error ?? "Error al guardar la palabra editada");
        // Si falló el insert, recargar para mostrar estado real
        await fetchWords();
        return;
      }

      // Actualizar la lista localmente sin recargar toda la API
      setWords((prev) =>
        prev
          .map((w) => (w.id === id ? addData.bannedWord : w))
          .sort((a, b) => a.word.localeCompare(b.word))
      );
      cancelEditing();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al editar la palabra");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleAdd() {
    if (!newWord.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-banned-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ word: newWord.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al agregar la palabra");
        return;
      }
      setWords((prev) =>
        [...prev, data.bannedWord].sort((a, b) => a.word.localeCompare(b.word))
      );
      setNewWord("");
    } catch {
      setError("Error al agregar la palabra");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin-banned-words?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setWords((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError("Error al eliminar la palabra");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Cargando lista...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">
            Palabras prohibidas
          </h2>
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
            {words.length}
          </span>
        </div>
        <button
          onClick={fetchWords}
          className="text-muted-foreground hover:text-white transition-colors"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Agregar nueva palabra */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nueva palabra prohibida..."
          className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
        />
        <Button
          onClick={handleAdd}
          disabled={adding || !newWord.trim()}
          className="bg-primary hover:bg-primary/90 text-white gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {adding ? "Agregando..." : "Agregar"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Lista de palabras */}
      <div className="bg-card/40 border border-border rounded-xl overflow-hidden">
        {words.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No hay palabras prohibidas todavía
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence>
              {words.map((word) => (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-4 py-2.5"
                >
                  {editingId === word.id ? (
                    // ── Modo edición inline ──────────────────────────────
                    <>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(word.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        disabled={savingEdit}
                        className="flex-1 bg-background border border-primary/40 rounded-md px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        onClick={() => handleSaveEdit(word.id)}
                        disabled={savingEdit}
                        className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                        title="Guardar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={savingEdit}
                        className="text-muted-foreground hover:text-white transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    // ── Modo lectura ─────────────────────────────────────
                    <>
                      <span className="flex-1 text-sm font-mono text-white">
                        {word.word}
                      </span>
                      <button
                        onClick={() => startEditing(word)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(word.id)}
                        disabled={deletingId === word.id}
                        className="text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
