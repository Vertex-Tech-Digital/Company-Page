import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminComments } from "@/components/admin/AdminComments";
import { AdminBannedWords } from "@/components/admin/AdminBannedWords";
import { AdminPosts } from "@/components/admin/AdminPosts";
import { AdminInvoices } from "@/components/admin/AdminInvoices";
import {
  MessageSquare,
  ShieldAlert,
  LogOut,
  FileText,
  Receipt,
} from "lucide-react";

type AdminView = "posts" | "comments" | "banned-words" | "invoices";

export default function Admin() {
  // null = todavía no se sabe (chequeando la cookie); true/false = resuelto.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [view, setView] = useState<AdminView>("posts");

  // La sesión vive en una cookie httpOnly: JS no puede leerla directamente,
  // así que preguntamos al servidor si la cookie que mande el navegador
  // (si hay alguna) sigue siendo válida.
  useEffect(() => {
    fetch("/api/admin-me", { credentials: "include" })
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/admin-logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
    }
  }

  // Todavía resolviendo si hay sesión activa
  if (isAuthenticated === null) {
    return <main className="min-h-screen bg-background" />;
  }

  // Sin sesión válida, mostrar login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
      </main>
    );
  }

  // Panel principal
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Barra superior */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Vertex Tech"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-sm font-semibold text-white tracking-wide">
              Panel Admin
            </span>
          </div>

          {/* Navegación entre secciones */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setView("posts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                view === "posts"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Posts
            </button>
            <button
              onClick={() => setView("comments")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                view === "comments"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Comentarios
            </button>
            <button
              onClick={() => setView("banned-words")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                view === "banned-words"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Palabras prohibidas
            </button>
            <button
              onClick={() => setView("invoices")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                view === "invoices"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Facturas
            </button>
          </nav>

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {view === "posts" && <AdminPosts />}
        {view === "comments" && <AdminComments />}
        {view === "banned-words" && <AdminBannedWords />}
        {view === "invoices" && <AdminInvoices />}
      </div>
    </main>
  );
}
