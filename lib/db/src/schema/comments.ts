import { pgTable, serial, text, timestamp, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { postsTable } from "./posts";

// Estado de moderación de un comentario.
// pending  -> recién llegado, esperando revisión de Anier
// approved -> Anier lo aprobó, se muestra públicamente
// rejected -> Anier lo rechazó, nunca se muestra
export const commentStatusEnum = pgEnum("comment_status", [
  "pending",
  "approved",
  "rejected",
]);

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),

  // A qué post pertenece este comentario. Si se borra el post, se borran
  // sus comentarios también (a diferencia de categories, aquí sí tiene
  // sentido el borrado en cascada).
  postId: integer("post_id")
    .notNull()
    .references(() => postsTable.id, { onDelete: "cascade" }),

  // Datos de quien comenta. No pedimos cuenta de usuario, solo nombre/email,
  // ya que son "usuarios externos" según el requerimiento.
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),

  content: text("content").notNull(),

  status: commentStatusEnum("status").notNull().default("pending"),

  // true si el filtro de palabras detectó algo sospechoso en este comentario.
  // Sirve para que Anier pueda priorizar/revisar estos con más cuidado en
  // el panel, en vez de bloquearlos automáticamente sin revisión humana.
  flagged: boolean("flagged").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  status: true,
  flagged: true,
  createdAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
