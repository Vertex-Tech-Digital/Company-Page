import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminComments } from "@/components/admin/AdminComments";
import { AdminBannedWords } from "@/components/admin/AdminBannedWords";
import { AdminPosts } from "@/components/admin/AdminPosts";
import { MessageSquare, ShieldAlert, LogOut, FileText } from "lucide-react";

type AdminView = "posts" | "comments" | "banned-words";

export default function Admin() {
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<AdminView>("posts");

  // Al cargar la página, verificar si ya hay un token guardado
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) setToken(saved);
  }, []);

  function handleLogout() {
    localStorage.removeItem("admin_token");
    setToken(null);
  }

  // Si no hay token, mostrar login
  if (!token) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <AdminLogin onLoginSuccess={setToken} />
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
        {view === "posts" && <AdminPosts token={token} />}
        {view === "comments" && <AdminComments token={token} />}
        {view === "banned-words" && <AdminBannedWords token={token} />}
      </div>
    </main>
  );
}
