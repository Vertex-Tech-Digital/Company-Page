import React from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ParticleNetwork } from "@/components/sections/ParticleNetwork";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { ChevronRight, Calendar, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  lastUpdated = "Octubre 2026",
  children,
}: LegalLayoutProps) {
  const { lang } = useLanguage();

  return (
    <main className="min-h-screen text-foreground font-sans relative bg-background">
      <ParticleNetwork />

      <div className="relative z-10">
        <Navbar />

        <div className="pt-28 pb-20 container mx-auto px-6 max-w-4xl">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-muted-foreground mb-6"
          >
            <Link
              href="/"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {lang === "es" ? "Inicio" : "Home"}
            </Link>
            <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-white font-medium">{title}</span>
          </nav>

          {/* Encabezado Principal */}
          <header className="mb-10 border-b border-border/60 pb-8">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-3"
              style={{ fontFamily: "var(--app-font-heading)" }}
            >
              {title}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
            <div className="flex items-center gap-2 text-xs text-primary/80 mt-4 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {lang === "es"
                  ? `Última actualización: ${lastUpdated}`
                  : `Last updated: ${lastUpdated}`}
              </span>
            </div>
          </header>

          {/* Contenido Legal */}
          <article className="space-y-8 text-sm sm:text-base text-slate-300 leading-relaxed">
            {children}
          </article>
        </div>

        <Footer />
      </div>

      <WhatsAppButton />
    </main>
  );
}
