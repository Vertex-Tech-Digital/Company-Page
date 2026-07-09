import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

// Estado de publicación de un post.
// draft     -> en edición, solo visible en el panel admin
// published -> visible públicamente en /blog y /blog/:slug
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

// Artículos del blog.
export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),

  // Identificador legible para la URL del artículo (ej. /blog/mi-articulo).
  slug: text("slug").notNull().unique(),

  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(), // resumen corto para la tarjeta del blog
  content: text("content").notNull(), // contenido completo del artículo
  imageUrl: text("image_url"),

  status: postStatusEnum("status").notNull().default("draft"),

  // Relación con categories: cada post pertenece a una sola categoría.
  // Si esa categoría se borra, el post queda sin categoría (null) en vez
  // de borrarse también (esto evita perder artículos por accidente).
  categoryId: integer("category_id").references(() => categoriesTable.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
