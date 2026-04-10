FROM postgres:16-alpine

# Create inventory schema first, then seed data.
COPY inventory-db/00_init.sql /docker-entrypoint-initdb.d/00_init.sql
COPY inventory-db-init/01_seed_inventory_stock.sql /docker-entrypoint-initdb.d/01_seed_inventory_stock.sql
COPY inventory-db-init/02_seed_inventory_hold.sql /docker-entrypoint-initdb.d/02_seed_inventory_hold.sql
