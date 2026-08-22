import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { devApiPlugin } from "./dev-api-plugin.mjs";

export default defineConfig(async () => {
  const isReplit = process.env.REPL_ID !== undefined;
  const isVercel = process.env.VERCEL === "1";

  const rawPort = process.env.PORT;
  const port = rawPort ? Number(rawPort) : 3000;

  const basePath = process.env.BASE_PATH ?? "/";

  // Plugin MDX para los casos conceptuales estáticos (src/content/casos/*.mdx).
  // Se activa solo si @mdx-js/rollup está instalado; si falta, el resto de la
  // app sigue funcionando. Para activarlo:
  //   pnpm --filter @workspace/vertex-tech add -D @mdx-js/rollup
  const plugins: any[] = [];
  try {
    const { default: mdx } = await import("@mdx-js/rollup");
    const { default: remarkGfm } = await import("remark-gfm");
    plugins.push({ enforce: "pre", ...mdx({ remarkPlugins: [remarkGfm] }) });
  } catch {
    console.warn(
      "[vite] @mdx-js/rollup no está instalado — los .mdx de casos conceptuales no compilarán.",
    );
  }
  plugins.push(react(), tailwindcss(), devApiPlugin());

  if (isReplit && !isVercel) {
    const { default: runtimeErrorOverlay } =
      await import("@replit/vite-plugin-runtime-error-modal");
    plugins.push(runtimeErrorOverlay());

    if (process.env.NODE_ENV !== "production") {
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      plugins.push(
        cartographer({ root: path.resolve(import.meta.dirname, "..") }),
      );
      const { devBanner } = await import("@replit/vite-plugin-dev-banner");
      plugins.push(devBanner());
    }
  }

  return {
    base: isVercel ? "/" : basePath,
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets",
        ),
      },
      dedupe: [
        "react",
        "react-dom",
        "three",
        "@react-three/fiber",
        "@react-three/drei",
      ],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
