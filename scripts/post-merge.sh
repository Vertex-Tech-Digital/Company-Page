#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Las migraciones de base de datos YA NO se aplican automáticamente aquí.
# `drizzle-kit push` aplicaba cambios de schema sin revisión ni versionado,
# directo contra la base de datos compartida por dev y producción.
#
# El flujo actual es:
#   1. `pnpm --filter db generate` genera un archivo de migración versionado
#   2. Ese archivo se revisa como parte del PR (igual que cualquier otro código)
#   3. Se aplica con `pnpm --filter db migrate` de forma explícita y controlada
#      (ver lib/db/README de migraciones / pipeline de CI)
