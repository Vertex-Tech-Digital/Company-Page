// _rate-limit.js — control de tasa compartido (por IP, usuario, etc.).
// El prefijo _ hace que Vercel NO lo exponga como ruta pública.
//
// Mismo enfoque que diagnostico.js: Upstash + Vercel KV (distribuido — a
// diferencia de un Map en memoria, el límite se respeta entre todas las
// instancias serverless, no solo dentro de una). Si KV_REST_API_URL/
// KV_REST_API_TOKEN no están configuradas, se degrada a "sin límite" en vez
// de bloquear el endpoint entero por una pieza de infraestructura opcional
// — mismo criterio que ya usa diagnostico.js.

const { kv } = require("@vercel/kv");
const { Ratelimit } = require("@upstash/ratelimit");

function buildRatelimit(prefix, limiter) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: kv,
    limiter,
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });
}

async function safeLimit(ratelimit, prefix, key) {
  try {
    return await ratelimit.limit(key);
  } catch (err) {
    // Si Upstash/KV falla, se deja pasar la request sin límite en vez de
    // tumbar el endpoint con un 500 — mismo criterio que cuando faltan
    // KV_REST_API_URL/KV_REST_API_TOKEN. No se loguea la key (puede ser la
    // IP).
    console.error(
      JSON.stringify({
        logType: "technical",
        action: "RATE_LIMIT",
        status: "FAILURE",
        prefix,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    );
    return null;
  }
}

function createRateLimiter({ prefix, count, window }) {
  const ratelimit = buildRatelimit(
    prefix,
    Ratelimit.slidingWindow(count, window),
  );

  // Devuelve true si la key está limitada (que es lo que espera el
  // call site: `if (await isRateLimited(clientIp)) return 429`).
  return async function isRateLimited(key) {
    if (!ratelimit) return false;
    const result = await safeLimit(ratelimit, prefix, key);
    return result ? !result.success : false;
  };
}

// Cuenta eventos en una ventana fija y devuelve true solo en el evento
// número `count` — ni antes ni después. Sirve para disparar una alerta una
// vez por ventana en vez de una por cada evento a partir del umbral. El
// INCRBY del script de Upstash es atómico, así que aunque lleguen varios
// eventos a la vez solo uno ve exactamente `count`.
function createThresholdCounter({ prefix, count, window }) {
  const ratelimit = buildRatelimit(
    prefix,
    Ratelimit.fixedWindow(count, window),
  );

  return async function reachesThreshold(key) {
    if (!ratelimit) return false;
    const result = await safeLimit(ratelimit, prefix, key);
    return Boolean(result && result.success && result.remaining === 0);
  };
}

// Misma extracción/normalización que diagnostico.js, para que el mismo
// visitante cuente igual en ambos endpoints.
function getClientIp(req) {
  const rawIp =
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
  let clientIp = (Array.isArray(rawIp) ? rawIp[0] : rawIp).split(",")[0].trim();
  if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    clientIp = "127.0.0.1";
  }
  return clientIp;
}

module.exports = { createRateLimiter, createThresholdCounter, getClientIp };
