// Pool de Postgres COMPARTIDO (singleton), reutilizado entre peticiones.
//
// Por qué: abrir/cerrar una conexión nueva por request (new Pool + pool.end)
// costaba ~2s contra Neon (Frankfurt), porque cada request pagaba el handshake
// TLS + auth. Reutilizando la conexión, la query baja a ~250ms.
//
// Persiste en dev (el dev-api-plugin no invalida los módulos dependencia, solo el
// handler) y en Vercel (estado a nivel de módulo entre invocaciones "calientes").
//
// IMPORTANTE: las funciones NO deben llamar a pool.end() por request.

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // max bajo: en serverless cada instancia tiene su pool; evitamos agotar el
  // límite de conexiones de Neon.
  max: 3,
  // Mantiene la conexión viva ~1 min entre clics para poder reutilizarla.
  idleTimeoutMillis: 60000,
  keepAlive: true,
});

// Sin este handler, un error en una conexión ociosa (Neon la cierra al suspender
// el compute, un blip de red, etc.) emitiría un evento 'error' sin listener y
// tumbaría el proceso. Con él, pg descarta esa conexión y reconecta en la
// siguiente query de forma transparente.
pool.on("error", (err) => {
  console.error("[db] error en conexión ociosa del pool:", err.message);
});

module.exports = { pool };
