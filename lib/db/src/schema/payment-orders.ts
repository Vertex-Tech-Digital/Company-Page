import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Estado real del cobro, actualizado SOLO por el webhook firmado de Stripe
// (api/stripe-webhook.js) — nunca por el cliente ni por la respuesta
// inmediata de /api/create-payment-intent, que solo sabe que el pago se
// *inició*, no que se completó.
export const paymentOrderStatusEnum = pgEnum("payment_order_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

// "Orden" server-side del checkout público con Stripe (/checkout,
// api/create-payment-intent.js). Se crea ANTES de llamar a Stripe: fija el
// importe y la identidad del pagador de forma inmutable, para que un
// reintento del cliente no pueda ni inflar el importe ni generar customers
// duplicados en Stripe (ver clientIdempotencyKey).
export const paymentOrdersTable = pgTable("payment_orders", {
  id: serial("id").primaryKey(),

  // Generado por el cliente (crypto.randomUUID()) una sola vez por intento de
  // pago y reenviado tal cual en cualquier reintento — así el servidor puede
  // reconocer "esto ya lo procesé" en vez de crear una orden nueva cada vez.
  clientIdempotencyKey: text("client_idempotency_key").notNull().unique(),

  name: text("name").notNull(),
  email: text("email").notNull(),

  // Importe validado y fijado en el servidor al crear la orden. Todo lo que
  // pasa después (Stripe, webhook) usa ESTE valor, nunca un req.body.amount
  // re-leído más adelante.
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),

  status: paymentOrderStatusEnum("status").notNull().default("pending"),

  stripeCustomerId: text("stripe_customer_id"),
  stripeInvoiceId: text("stripe_invoice_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentOrderSchema = createInsertSchema(
  paymentOrdersTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPaymentOrder = z.infer<typeof insertPaymentOrderSchema>;
export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;
