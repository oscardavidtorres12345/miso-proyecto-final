#!/usr/bin/env bash
# =============================================================================
#  deploy.sh — Despliega TravelHub en AWS EKS
#  Prerrequisitos: aws cli, terraform, kubectl, docker
# =============================================================================
set -euo pipefail

BOLD="\033[1m"; GREEN="\033[32m"; CYAN="\033[36m"; RESET="\033[0m"
step() { echo -e "\n${BOLD}${CYAN}▶ $1${RESET}"; }
ok()   { echo -e "  ${GREEN}✅ $1${RESET}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$SCRIPT_DIR/terraform"
K8S_DIR="$SCRIPT_DIR/k8s"
PAYMENT_SRC="$SCRIPT_DIR/../payment_service"

# ─── 1. Verificar herramientas ────────────────────────────────────────────────
step "Verificando herramientas"
for tool in aws terraform kubectl docker; do
  command -v "$tool" &>/dev/null || { echo "❌ '$tool' no encontrado"; exit 1; }
  ok "$tool encontrado"
done

# ─── 2. Terraform — levantar VPC + EKS + ECR ─────────────────────────────────
step "Aplicando Terraform (VPC + EKS + ECR)"
cd "$TF_DIR"
terraform init -upgrade
terraform apply -auto-approve
ok "Infraestructura lista"

# ─── 3. Capturar outputs de Terraform ────────────────────────────────────────
step "Capturando outputs"
ECR_URL=$(terraform output -raw ecr_repository_url)
AWS_REGION=$(terraform output -raw cluster_region)
CLUSTER_NAME=$(terraform output -raw cluster_name)
KUBECONFIG_CMD=$(terraform output -raw kubeconfig_command)

echo "  ECR URL    : $ECR_URL"
echo "  Cluster    : $CLUSTER_NAME"
echo "  Región     : $AWS_REGION"

# ─── 4. Configurar kubectl ────────────────────────────────────────────────────
step "Configurando kubectl → EKS"
eval "$KUBECONFIG_CMD"
kubectl cluster-info
ok "kubectl apuntando a EKS"

# ─── 5. Build + push imagen al ECR ───────────────────────────────────────────
step "Build y push de payment-service → ECR"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin \
    "$(echo "$ECR_URL" | cut -d/ -f1)"

# IMPORTANTE: --platform linux/amd64 fuerza imagen compatible con nodos EKS
# (t3.medium = x86_64). Sin esto, en Macs Apple Silicon (arm64) el build
# genera una imagen arm64 que los nodos rechazan con "no match for platform".
docker build --platform linux/amd64 -t payment-service:latest "$PAYMENT_SRC"
docker tag  payment-service:latest "$ECR_URL:latest"
docker push "$ECR_URL:latest"
ok "Imagen disponible en ECR: $ECR_URL:latest"

# ─── 6. Sustituir placeholder de la imagen en el manifest ────────────────────
step "Preparando manifests K8s"
TMP_DIR=$(mktemp -d)
cp -r "$K8S_DIR"/. "$TMP_DIR/"
sed -i.bak "s|PLACEHOLDER_ECR_IMAGE|$ECR_URL:latest|g" \
  "$TMP_DIR/payment-deployment.yaml"
ok "Imagen sustituida en payment-deployment.yaml"

# ─── 7. Aplicar manifests en EKS (en orden para evitar race conditions) ──────
# El gateway (nginx) falla al arrancar si payment-service no está listo porque
# intenta resolver el upstream DNS en el startup. Solución: aplicar y esperar
# cada capa antes de pasar a la siguiente.
step "Aplicando manifests en EKS (namespace travelhub)"

# 7a. Namespace primero — esperar propagación antes de crear recursos
kubectl apply -f "$TMP_DIR/namespace.yaml"
kubectl wait --for=jsonpath='{.status.phase}'=Active \
  namespace/travelhub --timeout=30s 2>/dev/null || sleep 5
ok "Namespace travelhub listo"

# 7b. Backend: Redis + payment-service + HPA (sin gateway todavía)
kubectl apply -f "$TMP_DIR/redis-deployment.yaml"
kubectl apply -f "$TMP_DIR/payment-deployment.yaml"
kubectl apply -f "$TMP_DIR/payment-hpa.yaml"
ok "Backend aplicado"

# ─── 8. Esperar backend antes de arrancar el gateway ────────────────────────
step "Esperando backend (Redis + payment-service) — máx 5 min"
kubectl rollout status deployment/redis           -n travelhub --timeout=300s
kubectl rollout status deployment/payment-service -n travelhub --timeout=300s
ok "Backend listo"

# 7c. Gateway — solo se arranca cuando el upstream ya resuelve en DNS
kubectl apply -f "$TMP_DIR/gateway-deployment.yaml"
ok "Gateway aplicado"

step "Esperando gateway — máx 3 min"
kubectl rollout status deployment/gateway -n travelhub --timeout=180s
ok "Todos los pods están Ready"

# ─── 9. Obtener la URL del Load Balancer ─────────────────────────────────────
step "Obteniendo URL pública del gateway"
echo "  Esperando que AWS asigne el Load Balancer (puede tardar ~60s)..."
for i in $(seq 1 20); do
  LB_HOST=$(kubectl get svc gateway-service -n travelhub \
    -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
  [ -n "$LB_HOST" ] && break
  sleep 6
done

if [ -z "$LB_HOST" ]; then
  echo "  ⚠️  LB aún no disponible. Consulta manualmente:"
  echo "     kubectl get svc gateway-service -n travelhub"
else
  ok "Gateway disponible en: http://$LB_HOST"
  echo ""
  echo "  Para lanzar el experimento de carga:"
  echo "    cd .. && python3 test_load.py http://$LB_HOST"
  echo ""
  echo "  Para lanzar el experimento de seguridad:"
  echo "    cd .. && python3 test_security.py http://$LB_HOST"
fi

rm -rf "$TMP_DIR"

