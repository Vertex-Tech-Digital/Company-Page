// _rate-limit.js — control de tasa compartido, por IP.
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

function createRateLimiter({ prefix, count, window }) {
  let ratelimit = null;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(count, window),
      analytics: true,
      prefix: `ratelimit:${prefix}`,
    });
  }

  // Devuelve true si la key está limitada (que es lo que espera el
  // call site: `if (await isRateLimited(clientIp)) return 429`).
  return async function isRateLimited(key) {
    if (!ratelimit) return false;
    const { success } = await ratelimit.limit(key);
    return !success;
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

module.exports = { createRateLimiter, getClientIp };
