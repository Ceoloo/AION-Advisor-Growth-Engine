#!/bin/bash
# Applies the SQL migrations in filename order after the auth shim.
# Runs automatically on first container boot (docker-entrypoint-initdb.d).
set -euo pipefail

MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"

echo "Applying AION migrations from ${MIGRATIONS_DIR}..."
for f in $(ls "${MIGRATIONS_DIR}"/*.sql | sort); do
  echo "  -> $(basename "$f")"
  psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" -f "$f"
done
echo "Migrations applied."
