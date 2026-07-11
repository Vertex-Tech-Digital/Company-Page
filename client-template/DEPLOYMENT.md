# Guía de despliegue — Vercel

Proceso para poner en producción el sitio de un cliente hecho con este template.

> **Estado actual:** aún no hay un Team de Vercel dedicado ni acceso confirmado al DNS de
> `vertextechdigital.com`. Esta guía deja el proceso listo; los pasos marcados **[ACCESO]**
> requieren tener esos accesos antes de ejecutarlos.

---

## 0. Preparación (una vez, a nivel Vertex)

- **[ACCESO]** Crear un **Team en Vercel** para Vertex (p. ej. `vertex-tech`). El plan Pro permite
  dominios y varios proyectos; el Hobby es solo para uso personal/no comercial.
- **[ACCESO]** Tener el dominio `vertextechdigital.com` con acceso al panel de DNS (donde esté
  registrado: Namecheap, Cloudflare, etc.). Se necesita para crear subdominios de cliente.
- Decidir el patrón de subdominios: `clienteN.vertextechdigital.com` o `nombre-cliente.vertextechdigital.com`.

---

## 1. Repositorio del cliente

1. Publicar este `client-template` como repo **Template** en la org de GitHub de Vertex
   (Settings → *Template repository*).
2. Para cada cliente: **Use this template** → nuevo repo privado `cliente-nombre`.
3. Personalizar `src/lib/site-config.ts`, `index.html`, `public/favicon.svg` (ver README).

---

## 2. Crear el proyecto en Vercel

### Opción A — Dashboard (recomendada la primera vez)

1. Vercel → **Add New → Project** → importar el repo del cliente.
2. Framework: **Vite** (autodetectado). Build `npm run build`, output `dist`.
3. **Project Settings → General → Node.js Version → `22.x`** (no 24.x: Vercel lo rechaza).
4. Deploy. Queda una URL `*.vercel.app` de prueba.

### Opción B — Vercel CLI

```bash
npm i -g vercel
vercel link      # enlaza el repo con un proyecto nuevo
vercel           # deploy de preview
vercel --prod    # deploy a producción
```

---

## 3. Dominio

### Opción A — Subdominio de Vertex (`clienteN.vertextechdigital.com`)

1. Vercel → proyecto del cliente → **Settings → Domains → Add** → `clienteN.vertextechdigital.com`.
2. Vercel indicará un registro DNS. **[ACCESO]** En el DNS de `vertextechdigital.com` crear:
   - Tipo **CNAME**, nombre `clienteN`, valor `cname.vercel-dns.com`.
3. Esperar propagación (minutos). Vercel emite el certificado HTTPS automáticamente.

### Opción B — Dominio propio del cliente (`www.cliente.com`)

1. Vercel → **Settings → Domains → Add** → `cliente.com` y `www.cliente.com`.
2. El cliente (o Vertex si gestiona su DNS) apunta en el registrador del cliente:
   - `A` de `@` → `76.76.21.21`, **o** `CNAME` de `www` → `cname.vercel-dns.com`
     (usar exactamente lo que muestre Vercel).
3. Vercel valida y emite HTTPS.

---

## 4. Variables de entorno

- Vercel → **Settings → Environment Variables**. Añadir las que use el proyecto
  (ver `.env.example`). Marcar como *Sensitive* las secretas.
- **Nunca** subir `.env` al repo (ya está en `.gitignore`).

---

## 5. Post-deploy (checklist rápido)

- [ ] La URL de producción carga y el HTTPS es válido (candado).
- [ ] Título/descripción correctos (SEO) y favicon del cliente.
- [ ] Enlaces de navegación y contacto funcionan.
- [ ] Probado en móvil.
- [ ] (Si aplica) analítica recibiendo eventos.

---

## Notas

- **Deploys automáticos:** al conectar el repo, cada push a la rama de producción despliega solo.
- **Previews:** cada PR genera una URL de preview automática.
- **Node 22.x:** mantener esa versión en *todos* los proyectos de cliente para evitar el error
  `Found invalid Node.js Version: "24.x"`.
