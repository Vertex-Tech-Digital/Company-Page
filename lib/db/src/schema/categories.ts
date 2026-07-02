import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Categorías del blog (Desarrollo, QA, APIs, IA, ...).
// Se guardan en base de datos (en vez de quemarse en el código) para que
// puedan renombrarse o agregarse nuevas sin tocar el código del sitio.
export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),

  // Identificador estable usado en URLs y filtros (ej. "qa", "desarrollo").
  // No cambia aunque se renombre el "name" visible para el usuario.
  slug: text("slug").notNull().unique(),

  // Nombre visible al usuario (ej. "QA & Testing"). Este sí puede editarse
  // libremente sin romper nada, ya que los posts apuntan al id, no al nombre.
  name: text("name").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;
