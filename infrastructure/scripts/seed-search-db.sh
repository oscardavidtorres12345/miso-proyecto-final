#!/usr/bin/env bash
set -euo pipefail

HOST="${1:?Usage: $0 <host> <port> <username> <password>}"
PORT="${2:?}"
USER="${3:?}"
PASS="${4:?}"
CONN="postgresql://${USER}:${PASS}@${HOST}:${PORT}/search_db"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_DIR="${SCRIPT_DIR}/../../infrastructure/docker/search-db-init"

# Verify search_db exists
if ! PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'search_db'" | grep -q 1; then
    echo "ERROR: search_db does not exist. Run create-databases.sh first."
    exit 1
fi

echo "=== Seeding search_db (schema + data) ==="

# Apply schema (idempotent — IF NOT EXISTS everywhere)
echo "Applying 01_schema.sql..."
PGPASSWORD="$PASS" psql -v ON_ERROR_STOP=1 -h "$HOST" -p "$PORT" -U "$USER" -d search_db -f "${SQL_DIR}/01_schema.sql"

# Apply seed data (idempotent — TRUNCATE + re-inserts)
echo "Applying 02_seed.sql..."
PGPASSWORD="$PASS" psql -v ON_ERROR_STOP=1 -h "$HOST" -p "$PORT" -U "$USER" -d search_db -f "${SQL_DIR}/02_seed.sql"

echo "=== search_db seeded successfully ==="
