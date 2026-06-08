import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CodeCard } from "./CodeCard";

export function Hero() {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight" data-testid="hero-title">
              Transformamos ideas en aplicaciones web de <span className="text-primary">alto rendimiento</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="hero-subtitle">
              Desarrollo Fullstack, APIs e integración de sistemas con React, Next.js y Node.js para empresas que buscan velocidad, escalabilidad y calidad técnica.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => scrollTo("#contacto")}
                size="lg" 
                className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] text-base px-8 h-14"
                data-testid="hero-cta-primary"
              >
                Solicitar consulta
              </Button>
              <Button 
                onClick={() => scrollTo("#proyectos")}
                variant="outline" 
                size="lg" 
                className="border-border hover:bg-white/5 text-base px-8 h-14"
                data-testid="hero-cta-secondary"
              >
                Ver proyectos
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="hidden lg:block"
          >
            <CodeCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
