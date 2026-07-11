import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Clientes de Vertex (CRM mínimo). Se crean/actualizan al emitir una factura y
// servirán de base para el CRM del Entregable B. El NIF es único: identifica al
// cliente y permite deduplicar (upsert por NIF al facturar).
export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),

  legalName: text("legal_name").notNull(),
  nif: text("nif").notNull().unique(),
  email: text("email").notNull(),
  address: text("address").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
