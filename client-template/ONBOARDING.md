# Checklist de onboarding técnico — cliente nuevo

Guía paso a paso para Vertex Tech cuando entra un cliente y hay que montar su sitio.
Copia esta checklist por cada cliente y ve marcando.

**Cliente:** ____________________   **Fecha inicio:** __________   **Responsable Vertex:** __________

---

## 1. Información a recopilar del cliente (antes de tocar código)

- [ ] **Marca:** nombre comercial, eslogan, descripción del negocio.
- [ ] **Identidad visual:** logo (SVG/PNG alta resolución), colores de marca, tipografía (si tiene).
- [ ] **Contenido:** textos de secciones, servicios/productos, imágenes.
- [ ] **Contacto:** email, teléfono, dirección, redes sociales.
- [ ] **Dominio:** ¿subdominio de Vertex (`clienteN.vertextechdigital.com`) o dominio propio?
      Si es propio: ¿ya lo tiene comprado? ¿quién gestiona su DNS?
- [ ] **Integraciones:** analítica (GA4, Plausible…), formulario de contacto, píxel, chat, etc.
- [ ] **Legal:** textos de aviso legal / privacidad / cookies (si aplica).

## 2. Repositorio

- [ ] Crear repo del cliente desde el **Template** de GitHub (`Use this template`) → `cliente-nombre` (privado).
- [ ] Dar acceso al equipo de Vertex que corresponda.
- [ ] `npm install` y `npm run dev` para verificar que arranca en local.

## 3. Personalización

- [ ] Editar `src/lib/site-config.ts` (marca, eslogan, color, contacto, nav, servicios).
- [ ] `index.html`: `<title>` y `<meta description>` (SEO).
- [ ] `public/favicon.svg`: icono del cliente.
- [ ] Añadir/ajustar secciones en `src/components/` según necesidades.
- [ ] Revisar responsive (móvil/tablet/desktop).
- [ ] `npm run build` y `npm run typecheck` sin errores.

## 4. Despliegue (ver DEPLOYMENT.md)

- [ ] Crear proyecto en Vercel a partir del repo del cliente.
- [ ] **Node.js Version = 22.x** en Project Settings.
- [ ] Configurar variables de entorno (si las hay).
- [ ] Añadir el dominio (subdominio de Vertex o dominio propio) y verificar DNS + HTTPS.
- [ ] Confirmar deploy automático en cada push.

## 5. Verificación final

- [ ] Sitio en producción con HTTPS válido.
- [ ] SEO básico: title, description, favicon, Open Graph (si aplica).
- [ ] Rendimiento aceptable (Lighthouse) y sin errores en consola.
- [ ] Formulario/CTA de contacto funcionando.
- [ ] Analítica registrando visitas (si aplica).
- [ ] Probado en al menos 2 navegadores + móvil.

## 6. Entrega y cierre

- [ ] Enviar al cliente la URL final y credenciales/accesos que le correspondan.
- [ ] Documentar en el repo (README del cliente) cómo actualizar contenido.
- [ ] Registrar el proyecto en el panel interno de Vertex (facturación, estado de proyecto).
- [ ] Acordar mantenimiento/soporte posterior (si aplica).

---

> Mantén esta checklist versionada en el repo del cliente para trazabilidad.
