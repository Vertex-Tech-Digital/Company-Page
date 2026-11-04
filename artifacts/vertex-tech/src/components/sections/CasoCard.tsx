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
}

// Tarjeta de caso conceptual para el listado en /casos-conceptuales.
// Muestra portada, título, resumen breve, seudónimo y fecha.
export function CasoCard({ caso, index }: CasoCardProps) {
  return (
    <Link href={`/casos-conceptuales/${caso.slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group rounded-2xl overflow-hidden border border-border bg-card/40 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] transition-all duration-300 flex flex-col cursor-pointer"
        data-testid={`caso-card-${index}`}
      >
        <div className="aspect-video relative overflow-hidden bg-background">
          <img
            src={caso.coverImage}
            alt={caso.title}
            loading="lazy"
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
          />
        </div>

        <div className="p-4 sm:p-6 flex flex-col flex-1">
          <h3 className="text-base sm:text-lg font-bold text-white mb-2.5 sm:mb-3 leading-snug group-hover:text-primary transition-colors">
            {caso.title}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 flex-1">
            {caso.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-3.5 sm:pt-4 border-t border-border/50">
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
