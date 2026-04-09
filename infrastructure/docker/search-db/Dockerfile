FROM postgres:16-alpine

# Keep both seeds to preserve current search behavior:
# 01 creates schema/base, 02 rebuilds with large catalog (room_id starts at 1).
COPY search-db-init/01_schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY search-db-init/01_seed_catalog.sql /docker-entrypoint-initdb.d/01_seed_catalog.sql
COPY search-db-init/02_seed.sql /docker-entrypoint-initdb.d/02_seed.sql
