/**
 * Utilidades de anonimización y redacción de PII (Personally Identifiable Information)
 * para cumplimiento con el RGPD y prevención de fugas de datos en logs operativos.
 */

export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== "string") return "[REDACTED_EMAIL]";
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return "[REDACTED_EMAIL]";

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex);

  if (localPart.length === 1) {
    return `*${domainPart}`;
  }
  if (localPart.length === 2) {
    return `${localPart[0]}*${domainPart}`;
  }
  return `${localPart[0]}***${domainPart}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== "string") return "[REDACTED_PHONE]";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "[REDACTED_PHONE]";

  const start = phone.slice(0, 4);
  const end = phone.slice(-2);
  return `${start}***${end}`;
}

export function maskNif(nif: string | null | undefined): string {
  if (!nif || typeof nif !== "string") return "[REDACTED_NIF]";
  const clean = nif.trim();
  if (clean.length < 4) return "[REDACTED_NIF]";
  const start = clean.slice(0, 3);
  const end = clean.slice(-1);
  return `${start}****${end}`;
}

export function maskName(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "[REDACTED_NAME]";
  const words = name.trim().split(/\s+/);
  return words.map((w) => (w.length > 0 ? `${w[0]}***` : "")).join(" ");
}

const PII_KEYS = new Set([
  "email",
  "name",
  "fullname",
  "firstname",
  "lastname",
  "phone",
  "telephone",
  "nif",
  "cif",
  "nie",
  "dni",
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "set-cookie",
  "address",
  "message",
  "freetext",
  "free_text",
]);

export function redactPii<T>(value: T, depth = 0): T {
  if (depth > 5 || value === null || value === undefined) return value;

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPii(item, depth + 1)) as unknown as T;
  }

  if (typeof value === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const normalizedKey = k.toLowerCase().replace(/[-_]/g, "");
      if (PII_KEYS.has(normalizedKey)) {
        if (normalizedKey === "email" && typeof v === "string") {
          redacted[k] = maskEmail(v);
        } else if (
          (normalizedKey === "phone" || normalizedKey === "telephone") &&
          typeof v === "string"
        ) {
          redacted[k] = maskPhone(v);
        } else if (
          (normalizedKey === "nif" ||
            normalizedKey === "cif" ||
            normalizedKey === "nie" ||
            normalizedKey === "dni") &&
          typeof v === "string"
        ) {
          redacted[k] = maskNif(v);
        } else if (
          (normalizedKey === "name" ||
            normalizedKey === "fullname" ||
            normalizedKey === "firstname" ||
            normalizedKey === "lastname") &&
          typeof v === "string"
        ) {
          redacted[k] = maskName(v);
        } else {
          redacted[k] = "[REDACTED]";
        }
      } else {
        redacted[k] = redactPii(v, depth + 1);
      }
    }
    return redacted as T;
  }

  return value;
}
