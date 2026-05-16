#!/usr/bin/env bash
set -euo pipefail

HOST="${1:?Usage: $0 <host> <port> <username> <password>}"
PORT="${2:?}"
USER="${3:?}"
PASS="${4:?}"
CONN="postgresql://${USER}:${PASS}@${HOST}:${PORT}/search_db"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_DIR="${SCRIPT_DIR}/../../infrastructure/docker/search-db-init"

# ─── psql path (preferred) ───────────────────────────────────────────────────
seed_psql() {
  if ! PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U "$USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'search_db'" | grep -q 1; then
    echo "ERROR: search_db does not exist. Run create-databases.sh first."
    exit 1
  fi

  echo "=== Seeding search_db via psql ==="
  PGPASSWORD="$PASS" psql -v ON_ERROR_STOP=1 -h "$HOST" -p "$PORT" -U "$USER" -d search_db -f "${SQL_DIR}/01_schema.sql"
  PGPASSWORD="$PASS" psql -v ON_ERROR_STOP=1 -h "$HOST" -p "$PORT" -U "$USER" -d search_db -f "${SQL_DIR}/02_seed.sql"
}

# ─── kubectl path (fallback when psql not installed) ─────────────────────────
seed_kubectl() {
  local ns="travelhub"
  local cm="search-schema-tf"
  local job="search-db-seed-tf"

  kubectl delete job "$job" -n "$ns" --force >/dev/null 2>&1 || true
  kubectl delete configmap "$cm" -n "$ns" >/dev/null 2>&1 || true

  kubectl create configmap "$cm" --from-file="$SQL_DIR" -n "$ns" \
    --dry-run=client -o yaml | kubectl apply -f -

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
          env:
            - name: PGHOST
              value: "$HOST"
            - name: PGPORT
              value: "$PORT"
            - name: PGUSER
              value: "$USER"
            - name: PGPASSWORD
              value: "$PASS"
            - name: PGDATABASE
              value: "search_db"
          command: ["/bin/sh", "-c"]
          args:
            - |
              for f in /schema/*.sql; do
                echo "Applying \$(basename \$f)"
                psql -d search_db -f "\$f"
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
  kubectl logs job/"$job" -n "$ns"
  kubectl delete job "$job" -n "$ns" --force >/dev/null 2>&1 || true
  kubectl delete configmap "$cm" -n "$ns" >/dev/null 2>&1 || true
}

# ─── Retry loop ────────────────────────────────────────────────────────────────
for attempt in 1 2 3 4 5 6; do
  if command -v psql >/dev/null 2>&1; then
    seed_psql && {
      echo "search_db seeded successfully via psql"
      exit 0
    }
  fi

  if command -v kubectl >/dev/null 2>&1 && kubectl get nodes >/dev/null 2>&1; then
    seed_kubectl && {
      echo "search_db seeded successfully via kubectl"
      exit 0
    }
  fi

  echo "Attempt $attempt/6: waiting for connectivity... (sleep 15s)"
  sleep 15
done

echo "ERROR: Neither psql nor kubectl cluster access available. search_db NOT seeded."
exit 1
