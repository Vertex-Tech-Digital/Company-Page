import test from "node:test";
import assert from "node:assert/strict";
import {
  maskEmail,
  maskPhone,
  maskNif,
  maskName,
  redactPii,
} from "../src/lib/redaction.ts";

test("maskEmail: anonimiza correctamente emails de diferentes longitudes", () => {
  assert.equal(maskEmail("carlos@gmail.com"), "c***@gmail.com");
  assert.equal(maskEmail("al@empresa.com"), "a*@empresa.com");
  assert.equal(maskEmail("a@b.com"), "*@b.com");
  assert.equal(maskEmail(""), "[REDACTED_EMAIL]");
  assert.equal(maskEmail(null), "[REDACTED_EMAIL]");
  assert.equal(maskEmail(undefined), "[REDACTED_EMAIL]");
  assert.equal(maskEmail("not-an-email"), "[REDACTED_EMAIL]");
});

test("maskPhone: anonimiza teléfonos preservando prefijo y sufijo", () => {
  assert.equal(maskPhone("+34 600 123 456"), "+34 ***56");
  assert.equal(maskPhone("612345678"), "6123***78");
  assert.equal(maskPhone("123"), "[REDACTED_PHONE]");
  assert.equal(maskPhone(null), "[REDACTED_PHONE]");
});

test("maskNif: anonimiza documentos fiscales NIF/NIE/CIF", () => {
  assert.equal(maskNif("12345678Z"), "123****Z");
  assert.equal(maskNif("B12345674"), "B12****4");
  assert.equal(maskNif("12"), "[REDACTED_NIF]");
  assert.equal(maskNif(null), "[REDACTED_NIF]");
});

test("maskName: anonimiza nombres de personas o empresas", () => {
  assert.equal(maskName("Carlos Santana"), "C*** S***");
  assert.equal(maskName("Juan"), "J***");
  assert.equal(maskName(""), "[REDACTED_NAME]");
  assert.equal(maskName(null), "[REDACTED_NAME]");
});

test("redactPii: anonimiza recursivamente objetos complejos", () => {
  const payload = {
    email: "test@example.com",
    name: "Ana Gomez",
    phone: "654321987",
    password: "supersecret123",
    details: {
      nif: "12345678Z",
      token: "jwt.token.here",
    },
  };

  const redacted = redactPii(payload);
  assert.equal(redacted.email, "t***@example.com");
  assert.equal(redacted.name, "A*** G***");
  assert.equal(redacted.phone, "6543***87");
  assert.equal(redacted.password, "[REDACTED]");
  assert.equal(redacted.details.nif, "123****Z");
  assert.equal(redacted.details.token, "[REDACTED]");
});

