# Política de Registro Operativo, Redacción de PII y Retención de Logs

## 1. Objetivo y Alcance

Esta política establece los estándares de logging, protección de datos personales identificables (PII) y ciclo de vida de retención de registros conforme al Reglamento General de Protección de Datos (RGPD / GDPR) y las directrices de seguridad de Vertex Tech Digital.

Aplica a todos los servicios backend, serverless functions y APIs (`@workspace/api-server`, `@workspace/vertex-tech`).

---

## 2. Clasificación de Logs y Separación Arquitectónica

Los registros se dividen estrictamente en dos flujos independientes:

### A. Logs Técnicos y Operativos

- **Finalidad**: Diagnóstico de fallos, monitorización de rendimiento, health checks y alertas de infraestructura.
- **Canal/Emisor**: `logger.error`, `logger.warn`, `logger.info`, `pinoHttp`.
- **Regla fundamental**: **Prohibido incluir PII sin enmascarar**. Queda estrictamente vedado el volcado de payloads completos, nombres, emails, teléfonos o credenciales en texto plano.
- **Redacción automática**: Pino está configurado con rutas de censura automáticas (`redact.paths`) para interceptar y sustituir campos como `email`, `phone`, `nif`, `name`, `authorization`, `cookie`, `password` por `[REDACTED]`.

### B. Logs de Auditoría (Audit Logs)

- **Finalidad**: Trazabilidad de acciones de negocio relevantes (envío de formularios de contacto, generación de facturas, inicio de sesión administrativo, moderación de contenidos).
- **Canal/Emisor**: `auditLogger.info` con estructura `{ logType: "audit", action, status, actor, timestamp }`.
- **Regla fundamental**: Si se requiere registrar una referencia de usuario para auditoría, debe emplearse un identificador anónimo (UUID/ID numérico) o PII truncada/enmascarada mediante funciones dedicadas (`maskEmail`, `maskPhone`, `maskNif`, `maskName`).

---

## 3. Estándar de Enmascaramiento de PII

| Tipo de Dato                        | Función       | Formato de Salida          | Ejemplo Entrada             | Ejemplo Salida   |
| :---------------------------------- | :------------ | :------------------------- | :-------------------------- | :--------------- |
| **Email**                           | `maskEmail()` | `inicial***@dominio`       | `usuario.ejemplo@gmail.com` | `u***@gmail.com` |
| **Teléfono**                        | `maskPhone()` | `prefijo***sufijo`         | `+34 600 123 456`           | `+34 ***56`      |
| **NIF / NIE / CIF**                 | `maskNif()`   | `prefijo****control`       | `12345678Z`                 | `1234****Z`      |
| **Nombre Persona / Razón Social**   | `maskName()`  | `Iniciales con asteriscos` | `Carlos Santana`            | `C*** S***`      |
| **Credenciales / Tokens / Cookies** | Pino `redact` | Redacción completa         | `Bearer eyJhbGci...`        | `[REDACTED]`     |

---

## 4. Política de Retención y Purgado de Logs

| Categoría de Log                     | Periodo Máximo de Retención | Almacenamiento                   | Mecanismo de Eliminación                            |
| :----------------------------------- | :-------------------------- | :------------------------------- | :-------------------------------------------------- |
| **Logs Técnicos de Desarrollo**      | 7 días                      | Local / Dev Server               | Sobrescritura en rotación                           |
| **Logs Operativos (Staging / Prod)** | 30 días                     | CloudWatch / Datadog / Pino logs | Expiración automática TTL (Time-To-Live) de 30 días |
| **Logs de Auditoría y Facturación**  | 365 días (1 año)\*          | Repositorio cifrado de auditoría | Purga programada anual tras auditoría fiscal        |

_\*Nota: El detalle de facturas se conserva en base de datos bajo los plazos tributarios legales (4 años en España), pero los logs de auditoría técnica asociados se limitan a 1 año._

---

## 5. Prácticas de Desarrollo Prohibidas

1. 🛑 `console.log(req.body)` o volcar cuerpos de peticiones completos sin filtrar.
2. 🛑 `logger.info({ email, name, phone })` con datos personales crudos.
3. 🛑 Registrar contraseñas, hashes, tokens JWT o secretos en cualquier nivel de log.
4. 🛑 Desactivar el filtro de redacción de Pino en entornos de desarrollo o producción.
