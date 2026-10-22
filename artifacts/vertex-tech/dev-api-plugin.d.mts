import type { Plugin } from "vite";

// Tipado del plugin local de API para `vite dev` (implementación en .mjs).
// La declaración sustituye la inferencia automática del JS, que ensanchaba
// apply: "serve" a string y rompía la compatibilidad con Vite.Plugin.
export declare function devApiPlugin(): Plugin;
