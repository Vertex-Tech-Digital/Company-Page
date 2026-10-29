import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
// import { Projects } from "@/components/sections/Projects"; // oculto temporalmente
import { Methodology } from "@/components/sections/Methodology";
import { WhyUs } from "@/components/sections/WhyUs";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { ParticleNetwork } from "@/components/sections/ParticleNetwork";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { SkipToContent } from "@/components/common/SkipToContent";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;

    let tries = 0;
    const interval = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        clearInterval(interval);
      } else if (++tries > 20) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-foreground font-sans bg-background relative selection:bg-primary/30 selection:text-white">
      <SkipToContent />
      <ParticleNetwork />
      {/* Capa oscura superpuesta con viñeta para textura sutil y contraste WCAG AAA */}
      <div
        className="fixed inset-0 pointer-events-none bg-gradient-to-b from-slate-950/40 via-background/70 to-background z-0"
        aria-hidden="true"
      />
      <div className="relative z-10">
        <header role="banner">
          <Navbar />
        </header>

        <main id="main-content" tabIndex={-1} className="outline-none">
          <Hero />
          <Services />
          {/* <Projects /> oculto temporalmente */}
          <Methodology />
          <WhyUs />
          <Contact />
        </main>

        <footer role="contentinfo">
          <Footer />
        </footer>
      </div>
      <WhatsAppButton />
    </div>
  );
}
