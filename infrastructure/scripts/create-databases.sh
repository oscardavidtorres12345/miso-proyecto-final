#!/bin/bash
# Create per-service databases in the shared RDS PostgreSQL instance.
# Called by Terraform local-exec provisioner (modules/rds/main.tf).
# Can also be run manually: ./create-databases.sh <host> <port> <user> <pass>
set -e

HOST="${1:?RDS host required}"
PORT="${2:?RDS port required}"
USER="${3:?RDS username required}"
PASS="${4:?RDS password required}"

CONNECTION="postgresql://${USER}:${PASS}@${HOST}:${PORT}/postgres"

DBS="search_db booking_db payment_db identity_db inventory_db"

# Helper: create a single DB using a kubectl temporary pod
run_kubectl() {
  local sql="$1"
  local pod="psql-create-dbs"

  # Clean up any stale pod
  kubectl delete pod "$pod" -n travelhub --force >/dev/null 2>&1 || true

  kubectl run "$pod" --restart=Never -n travelhub \
    --image=postgres:15-alpine \
    -- psql "$CONNECTION" -c "$sql" >/dev/null 2>&1 || true

  kubectl wait --for=condition=Completed "pod/$pod" -n travelhub --timeout=120s >/dev/null 2>&1 || true
  kubectl delete pod "$pod" -n travelhub --force >/dev/null 2>&1 || true
}

# Build one big SQL batch with idempotent CREATE DATABASE
SQL_BATCH=""
for db in $DBS; do
  SQL_BATCH="${SQL_BATCH}DO \$\$ BEGIN PERFORM 1 FROM pg_database WHERE datname = '${db}'; IF NOT FOUND THEN EXECUTE 'CREATE DATABASE ' || quote_ident('${db}'); END IF; END \$\$; "
done

# Try psql first (fastest), then kubectl fallback
for attempt in 1 2 3 4 5 6; do
  if command -v psql >/dev/null 2>&1; then
    psql "$CONNECTION" -c "$SQL_BATCH" 2>/dev/null && {
      echo "Databases created/verified via psql"
      exit 0
    }
  fi

  if command -v kubectl >/dev/null 2>&1 && kubectl get nodes >/dev/null 2>&1; then
    run_kubectl "$SQL_BATCH"
    echo "Databases created/verified via kubectl"
    exit 0
  fi

  echo "Attempt $attempt/6: waiting for connectivity... (sleep 15s)"
  sleep 15
done

echo "ERROR: Neither psql nor kubectl cluster access available. Databases NOT created."
exit 1
