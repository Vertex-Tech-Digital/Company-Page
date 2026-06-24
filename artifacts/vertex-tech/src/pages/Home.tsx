import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Projects } from "@/components/sections/Projects";
import { Methodology } from "@/components/sections/Methodology";
import { WhyUs } from "@/components/sections/WhyUs";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { ParticleNetwork } from "@/components/sections/ParticleNetwork";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
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
    <main className="min-h-screen text-foreground font-sans">
      <ParticleNetwork />
      <div className="relative" style={{ zIndex: 1 }}>
      <Navbar />
      <Hero />
      <Services />
      <Projects />
      <Methodology />
      <WhyUs />
      <Contact />
      <Footer />
      </div>
      <WhatsAppButton />
    </main>
  );
}
