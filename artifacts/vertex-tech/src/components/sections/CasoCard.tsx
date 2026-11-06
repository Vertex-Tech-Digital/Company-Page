import { motion } from "framer-motion";
import { Calendar, User } from "lucide-react";
import { Link } from "wouter";

export interface CasoPreview {
  slug: string;
  coverImage: string;
  pseudonym: string;
  tags?: string[];
  title: string;
  excerpt: string;
  date: string;
}

interface CasoCardProps {
  caso: CasoPreview;
  index: number;
  /** Tarjeta horizontal a todo el ancho (se usa cuando solo hay un caso). */
  featured?: boolean;
}

// Tarjeta de caso conceptual para el listado en /casos-conceptuales.
// Muestra portada, título, resumen breve, seudónimo y fecha.
export function CasoCard({ caso, index, featured = false }: CasoCardProps) {
  return (
    <Link href={`/casos-conceptuales/${caso.slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className={`group rounded-2xl overflow-hidden border border-border bg-card/40 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] transition-all duration-300 cursor-pointer ${
          featured
            ? "flex flex-col sm:grid sm:grid-cols-[1.15fr_1fr]"
            : "flex flex-col"
        }`}
        data-testid={`caso-card-${index}`}
      >
        <div
          className={`relative overflow-hidden bg-background ${
            featured
              ? "aspect-[16/10] sm:aspect-auto sm:min-h-[300px]"
              : "aspect-[2/1]"
          }`}
        >
          <img
            src={caso.coverImage}
            alt={caso.title}
            loading="lazy"
            className="absolute inset-0 object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        <div
          className={`flex flex-col flex-1 ${
            featured ? "p-6 sm:p-8 justify-center" : "p-4 sm:p-6"
          }`}
        >
          <h3
            className={`font-bold text-white leading-snug group-hover:text-primary transition-colors ${
              featured
                ? "text-xl sm:text-2xl lg:text-[1.75rem] mb-3 sm:mb-4"
                : "text-base sm:text-lg mb-2.5 sm:mb-3"
            }`}
          >
            {caso.title}
          </h3>
          <p
            className={`text-muted-foreground leading-relaxed flex-1 ${
              featured
                ? "text-sm sm:text-base line-clamp-3 mb-5"
                : "text-xs sm:text-sm line-clamp-3 mb-4 sm:mb-5"
            }`}
          >
            {caso.excerpt}
          </p>

          <div
            className={`mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground border-t border-border/50 ${
              featured ? "pt-4 sm:pt-5" : "pt-3.5 sm:pt-4"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {caso.date}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {caso.pseudonym}
            </span>
            {caso.tags && caso.tags.length > 0 && (
              <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                {caso.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary/90 font-mono text-[11px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
