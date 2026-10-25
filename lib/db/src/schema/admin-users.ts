import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Usuarios que pueden entrar al panel de administración a moderar
// comentarios (por ahora, solo Anier).
export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),

  username: text("username").notNull().unique(),

  // IMPORTANTE: nunca se guarda la contraseña en texto plano.
  // Aquí se guarda el resultado de bcrypt.hash(contraseña), no la
  // contraseña en sí. Ver lib/auth (lo crearemos en el paso del backend).
  passwordHash: text("password_hash").notNull(),

  // Se incrusta en cada JWT emitido (claim "sv"). Incrementarlo revoca de
  // golpe todas las sesiones activas del usuario server-side: logout,
  // cambio de contraseña, o "cerrar sesión en todos los dispositivos".
  sessionVersion: integer("session_version").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsersTable.$inferSelect;
