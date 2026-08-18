import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

/**
 * Configuracion unica de ESLint para todo el monorepo (flat config, ESLint 10).
 *
 * El repo mezcla tres entornos distintos y cada uno necesita globals y
 * sourceType propios:
 *   - React + navegador  -> artifacts/vertex-tech/src, mockup-sandbox, etc.
 *   - Node ESM           -> artifacts/api-server, scripts, archivos .mjs
 *   - Node CommonJS      -> artifacts/vertex-tech/api/*.js (funciones de Vercel)
 */
export default tseslint.config(
  // ---------------------------------------------------------------
  // 1. Ignorados globales
  // ---------------------------------------------------------------
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/out-tsc/**",
      "**/.vercel/**",
      "**/*.tsbuildinfo",
      // Codigo generado: se sobreescribe en cada regeneracion, no tiene
      // sentido lintearlo (mismos paths que en .prettierignore).
      "lib/api-client-react/src/generated/**",
      "lib/api-zod/src/generated/**",
      "artifacts/mockup-sandbox/src/.generated/**",
    ],
  },

  // ---------------------------------------------------------------
  // 2. Reglas base para todo el codigo JS/TS
  // ---------------------------------------------------------------
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"],
    rules: {
      // TypeScript ya detecta identificadores no definidos, y no-undef da
      // falsos positivos con tipos globales del DOM.
      "no-undef": "off",

      // Avisar en vez de bloquear: el codigo existente tiene "any" y
      // variables sin usar. Se limpian progresivamente sin frenar el CI.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Estos si son errores reales, no cuestiones de estilo.
      "no-empty": ["error", { allowEmptyCatch: true }],
      eqeqeq: ["error", "smart"],

      // Los @ts-ignore que hay hoy estan en archivos .js, donde apenas
      // tienen efecto. Se avisa para migrarlos a @ts-expect-error sin
      // bloquear el CI.
      "@typescript-eslint/ban-ts-comment": "warn",
    },
  },

  // ---------------------------------------------------------------
  // 3. React (navegador)
  // ---------------------------------------------------------------
  {
    files: [
      "artifacts/vertex-tech/src/**/*.{ts,tsx}",
      "artifacts/mockup-sandbox/src/**/*.{ts,tsx}",
      "lib/api-client-react/src/**/*.{ts,tsx}",
      "client-template/src/**/*.{ts,tsx}",
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Las reglas clasicas (rules-of-hooks, exhaustive-deps) atrapan bugs
      // reales: hooks dentro de condicionales, dependencias faltantes.
      // Se dejan como ERROR — el codigo actual ya las cumple al 100%,
      // asi que no cuestan nada hoy y evitan regresiones manana.
      ...reactHooks.configs.recommended.rules,

      // A partir de eslint-plugin-react-hooks v7, el preset "recommended"
      // incluye tambien las reglas del React Compiler. Son mucho mas
      // estrictas y hoy marcan 22 errores en codigo que funciona bien
      // (sobre todo shadcn/ui y los paneles de admin).
      //
      // Se bajan a "warn": quedan visibles para ir limpiandolas, pero no
      // bloquean el CI. Subirlas a "error" es un trabajo aparte, cuando el
      // equipo decida adoptar el React Compiler.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",

      // shadcn/ui exporta variantes junto a los componentes, lo que rompe
      // esta regla por diseno. Se deja como aviso.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // ---------------------------------------------------------------
  // 4. Node ESM (api-server, scripts, configs .mjs)
  // ---------------------------------------------------------------
  {
    files: [
      "artifacts/api-server/**/*.ts",
      "lib/db/**/*.ts",
      "lib/api-spec/**/*.ts",
      "scripts/**/*.ts",
      "**/*.mjs",
      "**/vite.config.*",
      "**/drizzle.config.*",
    ],
    languageOptions: {
      globals: globals.node,
      sourceType: "module",
    },
  },

  // ---------------------------------------------------------------
  // 5. Node CommonJS: codigo de backend de vertex-tech.
  //    Usan require()/module.exports, no ESM.
  //
  //    Incluye src/utils/*.js aunque viva dentro de src/: esos archivos
  //    (analyzeFreeText, generateDiagnosisPDF) solo los consumen las
  //    funciones de api/, nunca se bundlean para el navegador.
  // ---------------------------------------------------------------
  {
    files: [
      "artifacts/vertex-tech/api/**/*.js",
      "artifacts/vertex-tech/server/**/*.js",
      "artifacts/vertex-tech/src/utils/*.js",
    ],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
    rules: {
      // require() es la forma correcta aqui.
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // ---------------------------------------------------------------
  // 6. SIEMPRE AL FINAL: apaga las reglas de estilo que chocarian
  //    con Prettier. Si se mueve, ESLint y Prettier se pelean.
  // ---------------------------------------------------------------
  prettier,
);
