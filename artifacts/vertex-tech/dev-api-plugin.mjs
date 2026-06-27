import { createRequire } from "node:module";
import { loadEnv } from "vite";
import path from "node:path";
import fs from "node:fs";

/**
 * Plugin de Vite SOLO para `vite dev`.
 *
 * Monta las funciones serverless de `api/*.js` (formato Vercel) como middleware
 * del dev server, para poder probar el backend (Stripe, contacto, etc.) con
 * `pnpm dev`, sin necesidad de `vercel dev`.
 *
 * No afecta al build ni a producción: `apply: "serve"`.
 */
export function devApiPlugin() {
  const require = createRequire(import.meta.url);

  return {
    name: "dev-api",
    apply: "serve",
    configureServer(server) {
      const root = server.config.root;

      // Carga TODAS las variables del .env (incluidas las que no llevan VITE_)
      // en process.env, para que las funciones puedan leer STRIPE_SECRET_KEY.
      const env = loadEnv(server.config.mode, root, "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        const name = url.split("?")[0].replace(/^\/api\//, "");
        const file = path.join(root, "api", `${name}.js`);
        if (!fs.existsSync(file)) return next();

        // Body JSON (las funciones esperan req.body ya parseado, estilo Vercel).
        let body = {};
        if (req.method === "POST" || req.method === "PUT") {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString("utf8");
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
        }

        // Shim de req/res al estilo de las funciones de Vercel.
        req.body = body;
        req.query = {};
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (obj) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
          return res;
        };

        try {
          // Recarga el handler en cada llamada para reflejar cambios sin reiniciar.
          delete require.cache[require.resolve(file)];
          const handler = require(file);
          await handler(req, res);
        } catch (err) {
          console.error(`[dev-api] error en /api/${name}:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Dev API error" }));
          }
        }
      });
    },
  };
}
