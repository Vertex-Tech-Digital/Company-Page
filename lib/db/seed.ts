/**
 * SEED — Datos iniciales de la base de datos
 *
 * Inserta:
 *   1. Las 4 categorías del blog
 *   2. Lista inicial de palabras prohibidas (30 palabras)
 *   3. Usuario administrador (Anier) con contraseña hasheada
 *
 * Cómo correrlo:
 *   cd lib/db
 *   pnpm run seed
 *
 * Es seguro correrlo más de una vez: usa INSERT ... ON CONFLICT DO NOTHING
 * para no duplicar datos si ya existen.
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
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
// La contraseña real la introduce Sandy cuando ejecute el seed.
// Por defecto usamos "changeme123" como placeholder — Sandy debe cambiarla
// corriendo el seed con la variable ADMIN_PASSWORD definida:
//   ADMIN_PASSWORD="contraseña_real" pnpm run seed

const adminUsername = process.env.ADMIN_USERNAME ?? "anier";
const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";

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
  console.log("\n👤 Creando usuario administrador...");
  const passwordHash = await hash(adminPassword, 12);
  // El número 12 es el "salt rounds" — cuántas veces se aplica el hash.
  // 12 es el estándar recomendado: seguro sin ser demasiado lento.

  await db
    .insert(schema.adminUsersTable)
    .values({ username: adminUsername, passwordHash })
    .onConflictDoNothing(); // no duplica si el username ya existe

  console.log(`   ✓ Usuario "${adminUsername}" creado`);

  if (adminPassword === "changeme123") {
    console.log("\n⚠️  AVISO: La contraseña es el placeholder 'changeme123'.");
    console.log("   Para usar una contraseña real, corre:");
    console.log('   ADMIN_PASSWORD="tu_contraseña" pnpm run seed\n');
  }

  console.log("\n✅ Seed completado.");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Error en el seed:", err);
  pool.end();
  process.exit(1);
});
