# 🚀 TravelHub Architecture POC (Proof of Concept)

Este repositorio contiene la **Prueba de Concepto (PoC)** diseñada para validar los atributos de calidad críticos de la arquitectura de TravelHub. El entorno está contenerizado utilizando Docker para facilitar la ejecución local de los experimentos de **Seguridad** y **Escalabilidad**.

## 📋 Contexto del Proyecto
El objetivo es simular un entorno de microservicios ligero para validar las siguientes hipótesis de arquitectura:
1.  **EC001 (Escalabilidad):** Capacidad de soportar picos de 800 TPM mediante escalado horizontal (HPA).
2.  **EC003 (Seguridad):** Detección y bloqueo de fraude en tiempo real (< 2 segundos) usando Redis.

## 🛠️ Stack Tecnológico
* **API Gateway:** Nginx (Proxy Inverso y punto de entrada).
* **Backend:** Python FastAPI (Asíncrono).
* **Estado/Cache:** Redis (Almacenamiento de contadores y listas negras).
* **Orquestación:** Docker Compose (Local) / Kubernetes (Escalado).

---

## ⚡ Quick Start (Cómo correr el proyecto)

### Prerrequisitos
* Docker Desktop instalado y corriendo.
* Terminal (Bash, PowerShell o Zsh).

### Pasos de Ejecución

1.  **Levantar la infraestructura:**
    ```bash
    docker-compose up --build
    ```
    *Nota: Si es la primera vez, esto construirá la imagen personalizada del Gateway y descargará las dependencias de Python.*

2.  **Verificar estado (Health Check):**
    Abre tu navegador o usa curl:
    ```bash
    curl http://localhost/health
    ```
    Respuesta esperada: `{"status": "ok"}`

3.  **Detener el entorno:**
    ```bash
    docker-compose down
    ```

---

## 🧪 Experimento 1: Seguridad (EC003)
**Objetivo:** Validar que el sistema bloquea una IP después de **15 intentos** fallidos o sospechosos en un periodo de 2 minutos.

### Ejecución de la Prueba
Con el sistema corriendo, abre una nueva terminal y ejecuta este script para simular un ataque de fuerza bruta (20 peticiones rápidas):

```bash
# Script de simulación de ataque
for i in {1..20}; do
   echo -n "Intento #$i: "
   curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/pay \
   -H "Content-Type: application/json" \
   -d '{"card_number": "1234", "amount": 100, "merchant_id": "m1", "ip_address": "127.0.0.1"}'
   echo ""
done
```
## 🧪 Experimento 2: Escalabilidad (EC001)
**Objetivo**: Validar el comportamiento bajo carga **(800 TPM)**.

(Nota: Para la prueba completa de HPA se deben usar los manifiestos de la carpeta /k8s en un clúster como Minikube, ya que Docker Compose no soporta auto-escalado dinámico).

Estructura de Carpetas
Plaintext

```
travelhub-experiment/
├── docker-compose.yml       # Orquestación principal
├── gateway/                 # Configuración de Nginx (Ingress simulado)
│   ├── Dockerfile           # Imagen custom para evitar errores de montaje
│   └── travelhub_nginx.conf # Reglas de proxy
├── payment_service/         # Microservicio Core
│   ├── main.py              # Lógica de negocio y Rate Limiting
│   └── ...
├── fraud_service/           # Servicio auxiliar
└── k8s/                     # Manifiestos para despliegue en Kubernetes
```

---

## 🔧 Solución de Problemas Comunes

Error: "Mounts denied" o "Not a directory" en Gateway
- Si ves un error relacionado con nginx.conf al levantar el contenedor:

- Asegúrate de que estás usando la versión actualizada del docker-compose.yml que usa build: `./gateway.`

- Limpia los volúmenes antiguos y reinicia:

Bash
```
docker-compose down --volumes --remove-orphans
docker-compose up --build
Error: "Dial tcp: lookup registry-1.docker.io"
```
Si Docker falla al descargar imágenes por error de DNS:

- Edita tu configuración de Docker (/etc/docker/daemon.json o en Docker Desktop settings).

- Agrega los DNS de Google: "dns": `["8.8.8.8", "8.8.4.4"].`

- Reinicia Docker Desktop.

## 👥 Equipo TravelHub (Maestría en Ingeniería de Software)

- Angie Roa

- Daniela Suárez

- Esteban Heredia

- Oscar Torres



