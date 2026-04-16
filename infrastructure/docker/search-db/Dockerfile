FROM postgres:16-alpine

# Copy all scripts in search-db-init — PostgreSQL runs them in alphabetical order.
COPY search-db-init/*.sql /docker-entrypoint-initdb.d/
