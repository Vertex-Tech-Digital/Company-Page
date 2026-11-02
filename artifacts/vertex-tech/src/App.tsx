import { Switch, Route, Router as WouterRouter } from "wouter";
import Home from "@/pages/Home";
import { useEffect, Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { LanguageProvider } from "@/context/LanguageContext";
import { CookieConsent } from "@/components/sections/CookieConsent";
import { ScrollToTop } from "@/components/common/ScrollToTop";

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
const CasosConceptuales = lazy(() => import("@/pages/CasosConceptuales"));
const CasoConceptual = lazy(() => import("@/pages/CasoConceptual"));
const LegalNotice = lazy(() => import("@/pages/LegalNotice"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        {/* Casos conceptuales: listado estático (MDX) y detalle por slug.
            El contenido vive en src/content/casos/*.mdx — sin base de datos. */}
        <Route path="/casos-conceptuales" component={CasosConceptuales} />
        <Route path="/casos-conceptuales/:slug" component={CasoConceptual} />
        {/* Ruta oculta de pagos: no enlazada en el menú */}
        <Route path="/checkout" component={Checkout} />
        {/* Panel de administración (incluye la pestaña de Facturas, Entregable A).
            Protegido con el login JWT; no enlazado en el menú. */}
        <Route path="/admin" component={Admin} />
        <Route path="/diagnostico" component={Diagnostico} />
        {/* Páginas Legales y Cumplimiento Normativo (RGPD, LOPDGDD y LSSI-CE) */}
        <Route path="/aviso-legal" component={LegalNotice} />
        <Route path="/privacidad" component={PrivacyPolicy} />
        <Route path="/terminos" component={TermsOfService} />
        <Route path="/cookies" component={CookiePolicy} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Bundle de entrada (VTD-37 y VTD-50):
  // - react-query y los toasts solo los usa el panel admin, así que sus
  //   providers viven en pages/Admin.tsx.
  // - framer-motion no entra en este bundle: pesa ~80 KiB y la portada solo
  //   necesita fundidos y desplazamientos. Los componentes que se cargan aquí
  //   (portada, Navbar, CookieConsent) animan con CSS (`Reveal`, `usePresence`
  //   y las clases `vt-*` de index.css). Importar framer-motion desde
  //   cualquiera de ellos lo vuelve a meter; las rutas con lazy() sí pueden
  //   usarlo, porque lo cargan en su propio chunk.
  return (
    <LanguageProvider>
      <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
        <ScrollToTop />
        <Router />
      </WouterRouter>
      <CookieConsent />
    </LanguageProvider>
  );
}

export default App;
