import { useEffect } from "react";
import { siteConfig } from "@/lib/site-config";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export function App() {
  // Inyecta el color de marca del cliente como variable CSS global.
  useEffect(() => {
    document.documentElement.style.setProperty("--brand", siteConfig.brandColor);
    document.title = `${siteConfig.brandName} — ${siteConfig.tagline}`;
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main>
        <Hero />
        <Features />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
