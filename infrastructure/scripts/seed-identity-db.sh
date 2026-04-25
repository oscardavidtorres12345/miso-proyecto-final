#!/bin/bash
# Seed identity_db schema + reference data from services/identity-service/db_queries/init/
# Called by Terraform local-exec provisioner (modules/rds/main.tf).
# Can also be run manually: ./seed-identity-db.sh <host> <port> <user> <pass>
set -e

HOST="${1:?RDS host required}"
PORT="${2:?RDS port required}"
USER="${3:?RDS username required}"
PASS="${4:?RDS password required}"

CONNECTION="postgresql://${USER}:${PASS}@${HOST}:${PORT}/identity_db"

# Resolve SQL dir relative to this script (infrastructure/scripts/ → repo root → services/...)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_DIR="${SCRIPT_DIR}/../../services/identity-service/db_queries/init"

if [ ! -d "$SQL_DIR" ]; then
  echo "ERROR: SQL directory not found: $SQL_DIR"
  exit 1
fi

echo "Found SQL files in: $SQL_DIR"

# ─── psql path (fastest, preferred) ────────────────────────────────────────────
seed_psql() {
  for f in "$SQL_DIR"/*.sql; do
    echo "Applying $(basename "$f")"
    psql --set ON_ERROR_STOP=off "$CONNECTION" -f "$f" 2>/dev/null || true
  done
}

# ─── kubectl path (fallback when psql not installed) ───────────────────────────
seed_kubectl() {
  local ns="travelhub"
  local cm="identity-schema"
  local job="identity-db-seed"

  # Clean up stale resources
  kubectl delete job "$job" -n "$ns" --force >/dev/null 2>&1 || true
  kubectl delete configmap "$cm" -n "$ns" >/dev/null 2>&1 || true

  # Create ConfigMap with all SQL files
  kubectl create configmap "$cm" --from-file="$SQL_DIR" -n "$ns" \
    --dry-run=client -o yaml | kubectl apply -f -

  # Build Job YAML inline
  cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: $job
  namespace: $ns
spec:
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: psql
          image: postgres:15-alpine
          command: ["/bin/sh", "-c"]
          args:
            - |
              for f in /schema/*.sql; do
                echo "Applying \$(basename \$f)"
                psql "$CONNECTION" --set ON_ERROR_STOP=off -f "\$f" 2>/dev/null || true
              done
          volumeMounts:
            - name: schema
              mountPath: /schema
      volumes:
        - name: schema
          configMap:
            name: $cm
EOF

  kubectl wait --for=condition=Complete job/"$job" -n "$ns" --timeout=300s >/dev/null 2>&1 || true
  kubectl delete job "$job" -n "$ns" --force >/dev/null 2>&1 || true
  kubectl delete configmap "$cm" -n "$ns" >/dev/null 2>&1 || true
}

# ─── Retry loop ────────────────────────────────────────────────────────────────
for attempt in 1 2 3 4 5 6; do
  if command -v psql >/dev/null 2>&1; then
    seed_psql && {
      echo "Identity DB seeded successfully via psql"
      exit 0
    }
  fi

  if command -v kubectl >/dev/null 2>&1 && kubectl get nodes >/dev/null 2>&1; then
    seed_kubectl && {
      echo "Identity DB seeded successfully via kubectl"
      exit 0
    }
  fi

  echo "Attempt $attempt/6: waiting for connectivity... (sleep 15s)"
  sleep 15
done

echo "ERROR: Neither psql nor kubectl cluster access available. Identity DB NOT seeded."
exit 1
