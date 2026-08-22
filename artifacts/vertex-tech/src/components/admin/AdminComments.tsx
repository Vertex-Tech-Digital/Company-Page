import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Comment {
  id: number;
  author_name: string;
  author_email: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  flagged: boolean;
  created_at: string;
  post_title: string;
  post_slug: string;
}

export function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-moderation?resource=comments", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar comentarios");
      const data = await res.json();
      setComments(data.comments);
    } catch {
      setError("No se pudieron cargar los comentarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleModerate(id: number, status: "approved" | "rejected") {
    setProcessing(id);
    try {
      const res = await fetch(
        `/api/admin-moderation?resource=comments&id=${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) throw new Error();
      // Quitar el comentario de la lista al moderarlo
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Error al procesar el comentario");
    } finally {
      setProcessing(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Cargando comentarios...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">
            Comentarios pendientes
          </h2>
          {comments.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
              {comments.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchComments}
          className="text-muted-foreground hover:text-white transition-colors"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Sin comentarios */}
      {comments.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No hay comentarios pendientes de moderación</p>
        </div>
      )}

      {/* Lista de comentarios */}
      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`rounded-xl border p-4 space-y-3 ${
              comment.flagged
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-border bg-card/40"
            }`}
          >
            {/* Etiqueta flagged */}
            {comment.flagged && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Contenido sospechoso — revisar con cuidado
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-white">
                {comment.author_name}
              </span>
              <span>{comment.author_email}</span>
              <span>·</span>
              <span>{formatDate(comment.created_at)}</span>
              <span>·</span>
              <span className="text-primary">En: {comment.post_title}</span>
            </div>

            {/* Contenido */}
            <p className="text-sm text-foreground leading-relaxed">
              {comment.content}
            </p>

            {/* Acciones */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => handleModerate(comment.id, "approved")}
                disabled={processing === comment.id}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 hover:border-green-500/50 gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Aprobar
              </Button>
              <Button
                size="sm"
                onClick={() => handleModerate(comment.id, "rejected")}
                disabled={processing === comment.id}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 hover:border-red-500/50 gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rechazar
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
