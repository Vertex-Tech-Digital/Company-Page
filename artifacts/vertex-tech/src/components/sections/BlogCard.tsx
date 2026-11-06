import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { Link } from "wouter";

export interface BlogPostPreview {
  slug: string;
  image: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime?: string;
}

interface BlogCardProps {
  post: BlogPostPreview;
  index: number;
  /** Tarjeta horizontal a todo el ancho para el artículo principal. */
  featured?: boolean;
}

export function BlogCard({ post, index, featured = false }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
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
        data-testid={`blog-card-${index}`}
      >
        <div
          className={`relative overflow-hidden bg-background ${
            featured
              ? "aspect-[16/10] sm:aspect-auto sm:min-h-[320px]"
              : "aspect-[2/1]"
          }`}
        >
          <img
            src={
              post.image ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop"
            }
            alt={post.title}
            loading="lazy"
            className="absolute inset-0 object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-3 left-3">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-primary border border-primary/30">
              {post.category}
            </span>
          </div>
        </div>

        <div
          className={`flex flex-col flex-1 ${
            featured ? "p-6 sm:p-8 justify-center" : "p-5"
          }`}
        >
          <h3
            className={`font-bold text-white leading-snug group-hover:text-primary transition-colors ${
              featured
                ? "text-xl sm:text-2xl lg:text-[1.75rem] mb-3 sm:mb-4"
                : "text-lg mb-3"
            }`}
          >
            {post.title}
          </h3>
          <p
            className={`text-muted-foreground leading-relaxed flex-1 ${
              featured
                ? "text-sm sm:text-base line-clamp-4 sm:line-clamp-3 mb-5"
                : "text-sm line-clamp-3 mb-5"
            }`}
          >
            {post.excerpt}
          </p>

          <div
            className={`mt-auto flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 ${
              featured ? "pt-4 sm:pt-5" : "pt-4"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </span>
            {post.readTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </span>
            )}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
