import pino from "pino";
import { maskEmail, maskName, maskNif, maskPhone } from "./redaction";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Rutas a redactar automáticamente en Pino para prevenir la fuga de PII
 * en cualquier llamada operativa a logger o req.log.
 */
const PII_REDACT_PATHS = [
  // Cabeceras sensibles y cookies
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  // PII de usuario directo y anidado
  "email",
  "*.email",
  "*.*.email",
  "name",
  "*.name",
  "*.*.name",
  "phone",
  "*.phone",
  "*.*.phone",
  "nif",
  "*.nif",
  "*.*.nif",
  "password",
  "*.password",
  "*.*.password",
  "passwordHash",
  "*.passwordHash",
  "token",
  "*.token",
  "secret",
  "*.secret",
  // Cuerpos de petición si llegaran a serializarse
  "body",
  "req.body",
  "payload",
  "req.body.email",
  "req.body.name",
  "req.body.phone",
  "req.body.nif",
  "req.body.message",
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: PII_REDACT_PATHS,
    censor: (val: unknown, path: string[]) => {
      const lastKey = String(path[path.length - 1])
        .toLowerCase()
        .replace(/[-_]/g, "");
      if (typeof val === "string") {
        if (val.includes("***") || val.startsWith("[REDACTED")) {
          return val;
        }
        if (lastKey === "email") return maskEmail(val);
        if (lastKey === "phone" || lastKey === "telephone")
          return maskPhone(val);
        if (
          lastKey === "nif" ||
          lastKey === "cif" ||
          lastKey === "nie" ||
          lastKey === "dni"
        )
          return maskNif(val);
        if (
          lastKey === "name" ||
          lastKey === "fullname" ||
          lastKey === "firstname" ||
          lastKey === "lastname"
        )
          return maskName(val);
      }
      return "[REDACTED]";
    },
  },
  base: {
    service: "api-server",
    env: process.env.NODE_ENV ?? "development",
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});

/**
 * Logger estructurado para eventos de auditoría (acciones de usuario y cambios de estado),
 * separado explícitamente de los logs técnicos o errores de infraestructura.
 */
export const auditLogger = logger.child({ logType: "audit" });
