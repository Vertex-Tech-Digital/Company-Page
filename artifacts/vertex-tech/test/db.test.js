/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test");
const assert = require("node:assert/strict");

const { assertDatabaseTls } = require("../server/db.js");

const NEON_URL =
  "postgresql://usuario:secreto@ep-prueba-pooler.eu-central-1.aws.neon.tech/neondb";

// Fija variables de entorno solo mientras corre fn (undefined = borrarla) y
// después deja las que había.
function withEnv(vars, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function inProduction(fn) {
  return withEnv({ NODE_ENV: "production", PGSSLMODE: undefined }, fn);
}

test("assertDatabaseTls rechaza en producción las URLs con las que pg no cifraría", () => {
  for (const query of [
    "",
    "?sslmode=disable",
    "?ssl=0",
    // Como en pg, si el parámetro se repite gana el último.
    "?sslmode=require&sslmode=disable",
  ]) {
    inProduction(() => {
      assert.throws(
        () => assertDatabaseTls({ connectionString: NEON_URL + query }),
        /sin TLS/,
        `debería rechazar "${query}"`,
      );
    });
  }
});

test("assertDatabaseTls acepta en producción las URLs que activan TLS", () => {
  for (const query of [
    "?sslmode=require",
    "?sslmode=require&channel_binding=require",
    "?sslmode=verify-full",
    "?ssl=true",
    // Cifra sin verificar el certificado. No se bloquea para no tumbar una
    // config que hoy funciona; lo que se exige aquí es que haya TLS.
    "?sslmode=no-verify",
  ]) {
    inProduction(() => {
      assert.doesNotThrow(
        () => assertDatabaseTls({ connectionString: NEON_URL + query }),
        `debería aceptar "${query}"`,
      );
    });
  }
});

test("assertDatabaseTls tiene en cuenta PGSSLMODE si la URL no dice nada de TLS", () => {
  withEnv({ NODE_ENV: "production", PGSSLMODE: "require" }, () => {
    assert.doesNotThrow(() =>
      assertDatabaseTls({ connectionString: NEON_URL }),
    );
  });
  withEnv({ NODE_ENV: "production", PGSSLMODE: "disable" }, () => {
    assert.throws(
      () => assertDatabaseTls({ connectionString: NEON_URL }),
      /sin TLS/,
    );
  });
});

test("assertDatabaseTls no expone la URL ni la contraseña en el error", () => {
  inProduction(() => {
    assert.throws(
      () => assertDatabaseTls({ connectionString: NEON_URL }),
      (err) =>
        !err.message.includes("secreto") && !err.message.includes("neon.tech"),
    );
  });
});

test("assertDatabaseTls no bloquea fuera de producción ni sin DATABASE_URL", () => {
  withEnv({ NODE_ENV: "development", PGSSLMODE: undefined }, () => {
    assert.doesNotThrow(() =>
      assertDatabaseTls({ connectionString: NEON_URL }),
    );
  });
  inProduction(() => {
    assert.doesNotThrow(() =>
      assertDatabaseTls({ connectionString: undefined }),
    );
    assert.doesNotThrow(() => assertDatabaseTls({ connectionString: "" }));
  });
});

test("assertDatabaseTls deja que pg falle al conectar si no entiende la URL", () => {
  inProduction(() => {
    assert.doesNotThrow(() =>
      assertDatabaseTls({
        connectionString: "postgresql://usuario:secreto@host:puerto/neondb",
      }),
    );
  });
});
