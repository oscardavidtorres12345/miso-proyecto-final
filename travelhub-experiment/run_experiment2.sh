#!/usr/bin/env bash
# =============================================================================
# run_experiment2.sh — Orquestador del Experimento 2 (Escalabilidad EC001)
#
# Uso: cd travelhub-experiment && bash run_experiment2.sh
# =============================================================================
set -e

NAMESPACE="travelhub"
K8S_DIR="./k8s"
PAYMENT_IMAGE="payment-service:latest"
PAYMENT_DIR="./payment_service"

CYAN="\033[0;36m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"
RED="\033[0;31m"; NC="\033[0m"; BOLD="\033[1m"

step()  { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }
ok()    { echo -e "  ${GREEN}✅ $1${NC}"; }
warn()  { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
fail()  { echo -e "  ${RED}❌ $1${NC}"; exit 1; }

echo -e "\n${BOLD}============================================================"
echo -e "  EXPERIMENTO 2 — Escalabilidad con HPA (EC001)"
echo -e "============================================================${NC}"

# ─── 1. Verificar que Minikube está corriendo ─────────────────────────────────
step "Verificando Minikube"
STATUS=$(minikube status --format='{{.Host}}' 2>/dev/null || echo "Stopped")
if [[ "$STATUS" != "Running" ]]; then
  fail "Minikube no está corriendo. Arráncalo con: minikube start"
fi
ok "Minikube está Running"

# ─── 2. Crear namespace (idempotente) ─────────────────────────────────────────
step "Creando namespace '$NAMESPACE'"
kubectl apply -f "$K8S_DIR/namespace.yaml"
ok "Namespace '$NAMESPACE' listo"

# ─── 3. Habilitar metrics-server (necesario para HPA) ────────────────────────
step "Habilitando metrics-server"
minikube addons enable metrics-server 2>&1 | grep -v "^$" || true
ok "metrics-server habilitado"

# ─── 4. Construir imagen dentro del Docker de Minikube ───────────────────────
step "Construyendo imagen '$PAYMENT_IMAGE' en el Docker de Minikube"
echo "  (eval \$(minikube docker-env) — esto no afecta tu Docker local)"
eval "$(minikube docker-env)"
docker build -t "$PAYMENT_IMAGE" "$PAYMENT_DIR" --quiet
ok "Imagen '$PAYMENT_IMAGE' lista en Minikube"

# ─── 5. Desplegar todos los manifiestos K8s ──────────────────────────────────
step "Aplicando manifiestos en namespace '$NAMESPACE'"
kubectl apply -f "$K8S_DIR/" --namespace="$NAMESPACE" 2>/dev/null || \
  kubectl apply -f "$K8S_DIR/"
ok "Manifiestos aplicados"

# ─── 6. Esperar a que los pods estén Ready ────────────────────────────────────
step "Esperando pods (máx 3 minutos)"
echo "  Esperando redis..."
kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=180s
echo "  Esperando payment-service..."
kubectl rollout status deployment/payment-service -n "$NAMESPACE" --timeout=180s
echo "  Esperando gateway..."
kubectl rollout status deployment/gateway -n "$NAMESPACE" --timeout=180s
ok "Todos los pods están Ready"

# ─── 7. Mostrar estado inicial ────────────────────────────────────────────────
step "Estado inicial del cluster"
echo ""
kubectl get pods -n "$NAMESPACE" -o wide
echo ""
kubectl get hpa -n "$NAMESPACE"
echo ""

# ─── 8. Monitoreo HPA en background ──────────────────────────────────────────
step "Iniciando monitoreo HPA en background"
(
  echo "  [HPA] Observando autoscaling..."
  kubectl get hpa payment-hpa -n "$NAMESPACE" -w 2>/dev/null
) &
HPA_PID=$!
ok "Monitoreo HPA activo (PID $HPA_PID)"

# ─── 9. Obtener URL del gateway (port-forward en macOS con driver Docker) ─────
step "Exponiendo gateway vía port-forward"
# En macOS con driver Docker la IP de Minikube no es accesible directamente.
# Usamos port-forward para tunnelizar al localhost.
GATEWAY_URL="http://localhost:38080"
kubectl port-forward -n "$NAMESPACE" service/gateway-service 38080:80 &>/tmp/pf_gateway.log &
PF_PID=$!
echo "  port-forward PID: $PF_PID"
sleep 3   # dar tiempo a que arranque
ok "Gateway disponible en: $GATEWAY_URL"

# ─── 10. Instalar dependencia si falta ────────────────────────────────────────
if ! python3 -c "import requests" 2>/dev/null; then
  step "Instalando 'requests' para Python"
  pip3 install requests --quiet
fi

# ─── 11. Lanzar la prueba de carga ────────────────────────────────────────────
step "Lanzando test de carga (800 TPM, 3 minutos)"
echo ""

# Restaurar Docker env local antes de correr Python
eval "$(minikube docker-env --unset)" 2>/dev/null || true

python3 test_load.py "$GATEWAY_URL"

# ─── 12. Resultado final ──────────────────────────────────────────────────────
kill "$HPA_PID" 2>/dev/null || true
kill "$PF_PID"  2>/dev/null || true

echo ""
step "Estado final del HPA"
kubectl get hpa payment-hpa -n "$NAMESPACE"
echo ""
step "Pods finales (debería haber más de 1 réplica)"
kubectl get pods -n "$NAMESPACE"

echo -e "\n${GREEN}${BOLD}✅ Experimento 2 completado.${NC}"
echo -e "${YELLOW}Para limpiar los recursos del experimento:${NC}"
echo -e "  kubectl delete namespace $NAMESPACE\n"

