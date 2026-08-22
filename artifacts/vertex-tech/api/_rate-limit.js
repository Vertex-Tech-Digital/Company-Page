// _rate-limit.js — control de tasa en memoria, por IP.
// El prefijo _ hace que Vercel NO lo exponga como ruta pública.
//
// Igual que el rate limiter de diagnostico.js: en memoria del proceso, así
// que se resetea en cada cold start y no comparte estado entre instancias.
// Suficiente para frenar abuso obvio en un endpoint de bajo tráfico; no es
// un límite distribuido.

function createRateLimiter({ count, windowMs }) {
  const hits = new Map();

  return function isRateLimited(key) {
    const now = Date.now();
    const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= count) {
      hits.set(key, timestamps);
      return true;
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    return false;
  };
}

// Vercel antepone la IP real del cliente a x-forwarded-for; el resto de la
// lista (si la hay) son proxies intermedios, así que solo confiamos en el
// primer valor.
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1"
  );
}

module.exports = { createRateLimiter, getClientIp };
