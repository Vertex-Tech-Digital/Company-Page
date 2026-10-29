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
const ConnectionParameters = require("pg/lib/connection-parameters");

// En producción nunca se conecta sin TLS. Si DATABASE_URL pierde el sslmode (o
// lleva sslmode=disable), pg no cifra y la contraseña podría viajar en claro.
// Neon ya rechaza esas conexiones, así que esto no tumba nada que hoy funcione:
// adelanta el fallo al arranque y deja el motivo claro en los logs de Vercel.
function assertDatabaseTls(config) {
  if (process.env.NODE_ENV !== "production" || !config.connectionString) {
    return;
  }

  let ssl;
  try {
    // El mismo cálculo que hará cada cliente del pool (URL + PGSSLMODE), para no
    // duplicar las reglas de pg y que puedan divergir.
    ssl = new ConnectionParameters(config).ssl;
  } catch {
    // Si pg no entiende la config, que falle al conectar, como hasta ahora.
    return;
  }
  if (!ssl) {
    throw new Error(
      "[db] DATABASE_URL conectaría sin TLS: usa sslmode=verify-full en la URL.",
    );
  }
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // max bajo: en serverless cada instancia tiene su pool; evitamos agotar el
  // límite de conexiones de Neon.
  max: 3,
  // Mantiene la conexión viva ~1 min entre clics para poder reutilizarla.
  idleTimeoutMillis: 60000,
  keepAlive: true,
};

assertDatabaseTls(poolConfig);

const pool = new Pool(poolConfig);

// Sin este handler, un error en una conexión ociosa (Neon la cierra al suspender
// el compute, un blip de red, etc.) emitiría un evento 'error' sin listener y
// tumbaría el proceso. Con él, pg descarta esa conexión y reconecta en la
// siguiente query de forma transparente.
pool.on("error", (err) => {
  console.error("[db] error en conexión ociosa del pool:", err.message);
});

module.exports = { pool, assertDatabaseTls };
