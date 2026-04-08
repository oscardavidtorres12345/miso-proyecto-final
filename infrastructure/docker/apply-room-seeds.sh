#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ejecuta seeds despues de que los servicios creen esquema/migraciones.

echo "[seed] Applying search seed..."
docker exec -i search-db psql -U travelhub -d search_db < "$ROOT_DIR/search-db-init/01_seed_catalog.sql"

echo "[seed] Applying inventory seed..."
docker exec -i inventory-db psql -U inventory_user -d inventory_db < "$ROOT_DIR/inventory-db-init/01_seed_inventory_stock.sql"
docker exec -i inventory-db psql -U inventory_user -d inventory_db < "$ROOT_DIR/inventory-db-init/02_seed_inventory_hold.sql"

echo "[seed] Done."
