import type { Plugin } from "vite";

// Tipado del plugin que inlinea el CSS de entrada en el build (implementación
// en .mjs), por el mismo motivo que dev-api-plugin.d.mts: la inferencia del JS
// ensancha apply y enforce a string y no encaja con Vite.Plugin.
export declare function inlineCssPlugin(): Plugin;
