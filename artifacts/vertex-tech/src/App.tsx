import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import { useEffect, Suspense, lazy } from "react";
import { LanguageProvider } from "@/context/LanguageContext";

// Cargados de forma diferida: Checkout arrastra el SDK de Stripe y no debe
// entrar en el bundle inicial de la portada.
const Checkout = lazy(() => import("@/pages/Checkout"));
const Admin = lazy(() => import("@/pages/Admin"));
const Diagnostico = lazy(() => import("@/pages/Diagnostico"));

const queryClient = new QueryClient();

function Router() {
  return (
    <Suspense fallback={null}>
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
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
