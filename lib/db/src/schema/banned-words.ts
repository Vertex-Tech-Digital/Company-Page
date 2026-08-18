import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Lista de palabras/expresiones bloqueadas en comentarios.
// Vive en base de datos (no en una constante del código) para que Anier
// pueda añadir o quitar palabras desde el panel de admin sin necesitar
// un nuevo despliegue del sitio.
export const bannedWordsTable = pgTable("banned_words", {
  id: serial("id").primaryKey(),

  // Se guarda siempre en minúsculas para comparar sin importar
  // mayúsculas/minúsculas al filtrar un comentario.
  word: text("word").notNull().unique(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBannedWordSchema = createInsertSchema(bannedWordsTable).omit(
  {
    id: true,
    createdAt: true,
  },
);

export type InsertBannedWord = z.infer<typeof insertBannedWordSchema>;
export type BannedWord = typeof bannedWordsTable.$inferSelect;
