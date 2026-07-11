# Vertex Client Template

Plantilla base de **Vertex Tech Digital** para arrancar el sitio de un cliente nuevo en minutos.
Stack ligera: **Vite + React 19 + TypeScript + Tailwind CSS v4**.

> Modelo: **un repo por cliente**. Este directorio es la fuente del template; se publica como
> repositorio "Template" en GitHub y cada cliente nace de un clon/copia suyo. Ver
> [ONBOARDING.md](./ONBOARDING.md) para el proceso completo.

## Requisitos

- Node.js 20 o 22 (Vercel soporta hasta 22.x; **no uses 24.x** en el proyecto de Vercel).
- npm (o pnpm/yarn).

## Arranque rápido

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción -> dist/
npm run preview  # previsualiza el build
npm run typecheck
```

## Personalizar para un cliente

El **90% del contenido de marca** se edita en un solo archivo:

- **[`src/lib/site-config.ts`](./src/lib/site-config.ts)** — nombre, eslogan, descripción, color de
  marca, contacto, navegación y bloques de servicios.

Otros puntos a tocar por cliente:

- `index.html` — `<title>` y `<meta name="description">` para SEO.
- `public/favicon.svg` — icono del cliente.
- `src/index.css` — tipografía o tokens extra si hacen falta.
- `src/components/*` — secciones (Hero, Features, Contact, Footer) si el cliente necesita más.

## Estructura

```
client-template/
├─ public/            # estáticos (favicon, imágenes)
├─ src/
│  ├─ components/     # secciones de la landing
│  ├─ lib/
│  │  └─ site-config.ts   # ⭐ configuración por cliente
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
├─ index.html
├─ vercel.json        # config de despliegue (SPA + Vite)
├─ DEPLOYMENT.md      # guía de despliegue en Vercel + dominios
└─ ONBOARDING.md      # checklist técnico para cliente nuevo
```

## Despliegue

Ver **[DEPLOYMENT.md](./DEPLOYMENT.md)** (Vercel + subdominio `clienteN.vertextechdigital.com`
o dominio propio del cliente).
