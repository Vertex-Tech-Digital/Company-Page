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
}

export function BlogCard({ post, index }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="group rounded-2xl overflow-hidden border border-border bg-card/40 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.12)] transition-all duration-300 flex flex-col cursor-pointer"
        data-testid={`blog-card-${index}`}
      >
        <div className="aspect-video relative overflow-hidden bg-background">
          <img
            src={
              post.image ||
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop"
            }
            alt={post.title}
            loading="lazy"
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-3 left-3">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-primary border border-primary/30">
              {post.category}
            </span>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-white mb-3 leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/50">
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
