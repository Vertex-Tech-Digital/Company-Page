import { motion } from "framer-motion";
import { PageNavbar } from "@/components/sections/PageNavbar";
import { Footer } from "@/components/sections/Footer";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { BlogCard, type BlogPostPreview } from "@/components/sections/BlogCard";
import { useLanguage } from "@/context/LanguageContext";

// Datos de prueba (mock). Más adelante se reemplazarán por contenido
// dinámico desde una base de datos / CMS. Por ahora solo maquetamos
// la arquitectura visual y los componentes repetitivos.
const mockPostsEs: BlogPostPreview[] = [
  {
    slug: "rendimiento-apps-react-2026",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
    category: "Desarrollo Web",
    title: "5 estrategias para mejorar el rendimiento de tus aplicaciones React",
    excerpt: "Analizamos técnicas de code-splitting, memoización y carga diferida que aplicamos en proyectos reales para reducir tiempos de carga.",
    date: "12 Jun 2026",
    readTime: "6 min",
  },
  {
    slug: "qa-automatizado-ciclo-desarrollo",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    category: "QA & Testing",
    title: "Por qué integrar QA automatizado desde el primer sprint",
    excerpt: "La detección temprana de errores reduce costos de forma exponencial. Te contamos cómo estructuramos nuestros ciclos de pruebas.",
    date: "05 Jun 2026",
    readTime: "5 min",
  },
  {
    slug: "apis-seguras-integraciones-terceros",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
    category: "APIs & Integraciones",
    title: "Buenas prácticas para construir APIs seguras y escalables",
    excerpt: "Autenticación, rate limiting y versionado: los pilares que no deben faltar al diseñar una arquitectura de API robusta.",
    date: "28 May 2026",
    readTime: "7 min",
  },
  {
    slug: "automatizacion-ia-procesos-negocio",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
    category: "Automatización & IA",
    title: "Cómo la automatización con IA está cambiando los flujos de trabajo",
    excerpt: "Desde chatbots hasta procesamiento inteligente de datos: ejemplos prácticos de automatización que multiplican la eficiencia.",
    date: "20 May 2026",
    readTime: "4 min",
  },
];

const mockPostsEn: BlogPostPreview[] = [
  {
    slug: "rendimiento-apps-react-2026",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
    category: "Web Development",
    title: "5 strategies to improve the performance of your React apps",
    excerpt: "We break down code-splitting, memoization, and lazy-loading techniques we apply in real projects to cut load times.",
    date: "Jun 12, 2026",
    readTime: "6 min",
  },
  {
    slug: "qa-automatizado-ciclo-desarrollo",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    category: "QA & Testing",
    title: "Why integrate automated QA from the very first sprint",
    excerpt: "Catching bugs early reduces costs exponentially. Here's how we structure our testing cycles.",
    date: "Jun 05, 2026",
    readTime: "5 min",
  },
  {
    slug: "apis-seguras-integraciones-terceros",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
    category: "APIs & Integrations",
    title: "Best practices for building secure, scalable APIs",
    excerpt: "Authentication, rate limiting, and versioning: the pillars you can't skip when designing a solid API architecture.",
    date: "May 28, 2026",
    readTime: "7 min",
  },
  {
    slug: "automatizacion-ia-procesos-negocio",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop",
    category: "Automation & AI",
    title: "How AI-driven automation is reshaping business workflows",
    excerpt: "From chatbots to smart data processing: practical automation examples that multiply efficiency.",
    date: "May 20, 2026",
    readTime: "4 min",
  },
];

export default function Blog() {
  const { lang } = useLanguage();
  const posts = lang === "es" ? mockPostsEs : mockPostsEn;

  return (
    <main className="min-h-screen text-foreground font-sans">
      <PageNavbar />

      {/* Header / Hero del blog */}
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, hsl(212 100% 56% / 0.15), transparent 60%)",
          }}
        />
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <span className="text-xs font-mono tracking-widest uppercase text-primary/80 mb-4 inline-block">
              {lang === "es" ? "Blog de Vertex Tech" : "Vertex Tech Blog"}
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
              data-testid="blog-title"
            >
              {lang === "es" ? (
                <>Ideas y aprendizajes sobre <span className="text-primary">tecnología y calidad</span></>
              ) : (
                <>Ideas and insights on <span className="text-primary">technology and quality</span></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed" data-testid="blog-subtitle">
              {lang === "es"
                ? "Artículos sobre desarrollo, QA, integraciones e inteligencia artificial, escritos por el equipo de Vertex Tech."
                : "Articles on development, QA, integrations and artificial intelligence, written by the Vertex Tech team."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid de artículos */}
      <section className="pb-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 gap-8">
            {posts.map((post, index) => (
              <BlogCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
}
