import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useEffect, Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { LanguageProvider } from "@/context/LanguageContext";

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

// Cargados de forma diferida: cada ruta pasa a su propio chunk para que la
// portada ("/") no descargue código de páginas que quizás nunca se visiten.
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Admin = lazy(() => import("@/pages/Admin"));
const Diagnostico = lazy(() => import("@/pages/Diagnostico"));

const queryClient = new QueryClient();

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        {/* Ruta oculta de pagos: no enlazada en el menú */}
        <Route path="/checkout" component={Checkout} />
        {/* Panel de administración (incluye la pestaña de Facturas, Entregable A).
            Protegido con el login JWT; no enlazado en el menú. */}
        <Route path="/admin" component={Admin} />
        <Route path="/diagnostico" component={Diagnostico} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter
            base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}
          >
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
