/**
 * SEED — Datos iniciales de la base de datos
 *
 * Inserta:
 *   1. Las 4 categorías del blog
 *   2. Lista inicial de palabras prohibidas (30 palabras)
 *   3. Usuario administrador, con contraseña hasheada
 *
 * Cómo correrlo:
 *   cd lib/db
 *   ADMIN_USERNAME="usuario" ADMIN_PASSWORD="contraseña_real_y_larga" pnpm run seed
 *
 * Categorías y palabras prohibidas: seguro correrlo más de una vez, usan
 * INSERT ... ON CONFLICT DO NOTHING (no duplican si ya existen).
 *
 * Usuario administrador: ADMIN_USERNAME y ADMIN_PASSWORD son obligatorias
 * (el seed falla si faltan — nada de defaults adivinables). Si el usuario ya
 * existe, re-correr el seed ROTA su contraseña (ON CONFLICT DO UPDATE) e
 * invalida sus sesiones activas — no es un no-op.
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import * as schema from "./src/schema/index.js";

// ─── Conexión ────────────────────────────────────────────────────────────────

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida. ¿Creaste el archivo .env?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ─── 1. Categorías ───────────────────────────────────────────────────────────

const categories = [
  { slug: "desarrollo-web", name: "Desarrollo Web" },
  { slug: "qa-testing", name: "QA & Testing" },
  { slug: "apis", name: "APIs & Integraciones" },
  { slug: "automatizacion-ia", name: "Automatización & IA" },
];

// ─── 2. Palabras prohibidas ───────────────────────────────────────────────────
// Lista inicial en español. Anier puede ampliarla desde el panel de admin.
// Se guardan en minúsculas para comparar sin importar mayúsculas al filtrar.

const bannedWords = [
  // Insultos generales
  "idiota",
  "imbecil",
  "estupido",
  "estupida",
  "imbécil",
  "estúpido",
  "estúpida",
  "maldito",
  "maldita",
  "imbeciles",
  // Lenguaje ofensivo
  "puta",
  "puto",
  "hijo de puta",
  "hdp",
  "coño",
  "joder",
  "mierda",
  "cabrón",
  "cabron",
  "pendejo",
  "pendeja",
  "gilipollas",
  "capullo",
  // Racismo / discriminación
  "negro de mierda",
  "sudaca",
  "inmigrante de mierda",
  // Spam típico
  "compra ahora",
  "gana dinero",
  "trabaja desde casa",
  "click aqui",
  "click aquí",
  "gana dinero facil",
  "gana dinero fácil",
  "oferta limitada",
  // Amenazas
  "te voy a matar",
  "te voy a encontrar",
  "voy a hacerte daño",
  // Contenido adulto
  "xxx",
  "porno",
  "sexo gratis",
].map((word) => ({ word: word.toLowerCase() }));

// ─── 3. Usuario administrador ─────────────────────────────────────────────────
// Sin valores por defecto a propósito: un placeholder conocido (p. ej. el
// "changeme123" que este script tenía antes) es una credencial pública en
// cuanto el seed corre sin ADMIN_PASSWORD definida — y así fue como pasó.
// El seed ahora falla en vez de crear una cuenta con una contraseña adivinable.
//   ADMIN_USERNAME="usuario" ADMIN_PASSWORD="contraseña_real_y_larga" pnpm run seed

const MIN_ADMIN_PASSWORD_LENGTH = 16;

const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminUsername) {
  throw new Error(
    'ADMIN_USERNAME no está definida. Corre: ADMIN_USERNAME="usuario" ADMIN_PASSWORD="contraseña_real_y_larga" pnpm run seed',
  );
}
if (!adminPassword) {
  throw new Error(
    'ADMIN_PASSWORD no está definida. Corre: ADMIN_USERNAME="usuario" ADMIN_PASSWORD="contraseña_real_y_larga" pnpm run seed',
  );
}
if (adminPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
  throw new Error(
    `ADMIN_PASSWORD es demasiado corta (mínimo ${MIN_ADMIN_PASSWORD_LENGTH} caracteres).`,
  );
}

// ─── Ejecución ────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Iniciando seed...\n");

  // 1. Categorías
  console.log("📂 Insertando categorías...");
  for (const category of categories) {
    await db
      .insert(schema.categoriesTable)
      .values(category)
      .onConflictDoNothing(); // no duplica si ya existe el slug
    console.log(`   ✓ ${category.name}`);
  }

  // 2. Palabras prohibidas
  console.log("\n🚫 Insertando palabras prohibidas...");
  let wordCount = 0;
  for (const entry of bannedWords) {
    await db
      .insert(schema.bannedWordsTable)
      .values(entry)
      .onConflictDoNothing(); // no duplica si ya existe la palabra
    wordCount++;
  }
  console.log(`   ✓ ${wordCount} palabras insertadas`);

  // 3. Usuario administrador
  console.log("\n👤 Configurando usuario administrador...");
  const passwordHash = await hash(adminPassword, 12);
  // El número 12 es el "salt rounds" — cuántas veces se aplica el hash.
  // 12 es el estándar recomendado: seguro sin ser demasiado lento.

  const existing = await db
    .select({ id: schema.adminUsersTable.id })
    .from(schema.adminUsersTable)
    .where(sql`${schema.adminUsersTable.username} = ${adminUsername}`)
    .limit(1);
  const isRotation = existing.length > 0;

  // DO UPDATE (no DO NOTHING): re-correr el seed con una contraseña nueva
  // debe reemplazar la anterior, no ser un no-op silencioso. Rotar la
  // contraseña también incrementa session_version, invalidando cualquier
  // sesión (cookie httpOnly) que siguiera activa con la credencial vieja —
  // sin necesidad de rotar JWT_SECRET ni tocar al resto de admins.
  await db
    .insert(schema.adminUsersTable)
    .values({ username: adminUsername, passwordHash })
    .onConflictDoUpdate({
      target: schema.adminUsersTable.username,
      set: {
        passwordHash,
        sessionVersion: sql`${schema.adminUsersTable.sessionVersion} + 1`,
      },
    });

  // Registro de auditoría mínimo: quién y cuándo se rotó/creó la credencial.
  // Va a stdout (logs de Vercel) — si se necesita un historial consultable
  // más adelante, el siguiente paso natural es persistirlo en una tabla.
  const actor = process.env.USER || process.env.USERNAME || "desconocido";
  console.log(
    `   ${isRotation ? "🔄 Contraseña rotada" : "✓ Usuario creado"} para "${adminUsername}" — ejecutado por "${actor}" el ${new Date().toISOString()}`,
  );
  if (isRotation) {
    console.log(
      "   Todas las sesiones activas de este usuario quedaron invalidadas.",
    );
  }

  console.log("\n✅ Seed completado.");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Error en el seed:", err);
  pool.end();
  process.exit(1);
});
