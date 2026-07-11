import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

// Estado de una factura.
// draft     -> borrador (no usado aún; reservado para futuro)
// sent      -> emitida y enviada por email al cliente
// paid      -> marcada como pagada
// cancelled -> anulada
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "cancelled",
]);

// Línea de la factura tal cual se persiste en la columna JSON `items`.
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),

  // Numeración correlativa VT-<AÑO>-<NNN>. Única y no editable.
  invoiceNumber: text("invoice_number").notNull().unique(),

  // Vínculo con el CRM. Se restringe el borrado del cliente si tiene facturas
  // (no se pueden perder facturas por borrar un cliente).
  clientId: integer("client_id").references(() => clientsTable.id, {
    onDelete: "restrict",
  }),

  // Copia inmutable de los datos fiscales del cliente EN EL MOMENTO DE EMISIÓN.
  // Requisito fiscal: la factura debe conservarse tal cual se emitió, aunque
  // luego se edite el registro del cliente.
  clientLegalName: text("client_legal_name").notNull(),
  clientNif: text("client_nif").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),

  language: text("language").notNull().default("es"),
  issueDate: text("issue_date").notNull(), // ISO yyyy-mm-dd
  dueDate: text("due_date"), // ISO yyyy-mm-dd, opcional

  // Líneas de la factura (concepto, cantidad, precio unitario).
  items: jsonb("items").$type<InvoiceItem[]>().notNull(),

  // Importes. numeric(12,2) para dinero; tax_rate en % (ej. 7.00 para IGIC 7%).
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),

  status: invoiceStatusEnum("status").notNull().default("sent"),

  // No se guarda el PDF: se regenera al vuelo desde estos datos cuando se descarga.

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
