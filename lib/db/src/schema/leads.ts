import {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const contactPreferenceEnum = pgEnum("contact_preference", [
  "cafe",
  "llamada",
  "email",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "nuevo",
  "contactado",
  "en_proceso",
  "cerrado",
]);

export const leadsTable = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    companyName: varchar("company_name", { length: 100 }).notNull(),
    sector: varchar("sector", { length: 50 }).notNull(),
    size: varchar("size", { length: 20 }).notNull(),
    markedProblems: integer("marked_problems").array().notNull(),
    freeText: text("free_text"),
    detectedProblems: integer("detected_problems").array().notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    contactPreference: contactPreferenceEnum("contact_preference").notNull(),
    status: leadStatusEnum("status").notNull().default("nuevo"),
    pdfSent: boolean("pdf_sent").notNull().default(true),
  },
  (table) => [
    index("leads_email_idx").on(table.email),
    index("leads_created_at_idx").on(table.createdAt),
  ]
);
