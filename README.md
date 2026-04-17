# 🚀 TravelHub — Monorepo

Repositorio principal del proyecto **TravelHub**, organizado como monorepo de microservicios.  
La arquitectura y decisiones de diseño están documentadas en la [Wiki del proyecto](https://github.com/oscardavidtorres12345/miso-proyecto-final/wiki).

---

## 📁 Estructura de Directorios

```
miso-proyecto-final/
│
├── services/                          # Microservicios backend (Python / FastAPI)
│   ├── api-gateway/                   # Nginx — punto de entrada único al sistema
│   │   └── nginx/                     # nginx.conf · cors.conf · rate-limit.conf
│   ├── identity-service/              # Autenticación y autorización (JWT / OAuth2)
│   ├── search-service/                # Búsqueda y disponibilidad de alojamientos
│   ├── booking-service/               # Gestión del ciclo de vida de reservas
│   └── payment-service/               # Procesamiento de pagos y detección de fraude
│
├── clients/                           # Aplicaciones frontend
│   ├── web-app/                       # React 18 — portal para huéspedes
│   │   └── src/
│   │       ├── components/            # common · search · booking · auth
│   │       ├── pages/
│   │       ├── store/slices/          # Estado global (Redux Toolkit)
│   │       ├── services/              # Llamadas a la API
│   │       ├── hooks/
│   │       ├── types/
│   │       └── utils/
│   ├── web-portal/                    # React 18 — portal para hoteleros
│   │   └── src/
│   │       ├── components/            # common · properties · dashboard · auth
│   │       ├── pages/
│   │       ├── store/slices/
│   │       ├── services/
│   │       ├── hooks/
│   │       ├── types/
│   │       └── utils/
│   └── mobile-app/                    # React Native — app móvil
│       └── src/
│           ├── components/            # common · search · booking · auth
│           ├── screens/
│           ├── navigation/
│           ├── store/slices/
│           ├── services/
│           ├── hooks/
│           ├── types/
│           └── utils/
│
├── shared/                            # Código y contratos compartidos entre servicios
│   ├── schemas/
│   │   ├── proto/                     # Definiciones Protocol Buffers (gRPC)
│   │   └── openapi/                   # Especificaciones OpenAPI / Swagger
│   └── libs/
│       ├── python/
│       │   └── travelhub_common/      # Librería Python compartida (modelos, utils, excepciones)
│       └── js/
│           ├── travelhub-ui/          # Componentes React reutilizables
│           └── travelhub-types/       # Tipos TypeScript compartidos
│
├── infrastructure/                    # Infraestructura como código (IaC)
│   ├── terraform/
│   │   ├── modules/                   # Módulos reutilizables
│   │   │   ├── eks/                   # Clúster Kubernetes en AWS
│   │   │   ├── rds/                   # Base de datos relacional
│   │   │   ├── elasticache/           # Redis gestionado
│   │   │   ├── kafka/                 # Mensajería asíncrona
│   │   │   ├── waf/                   # Web Application Firewall
│   │   │   └── cdn/                   # Distribución de contenido
│   │   └── environments/              # Variables por ambiente
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   ├── kubernetes/
│   │   ├── namespaces/                # Definición del namespace travelhub
│   │   ├── services/                  # Por cada servicio: Deployment · Service · HPA · ConfigMap
│   │   ├── ingress/                   # Ingress controller
│   │   ├── monitoring/                # Prometheus + Grafana
│   │   └── storage/                   # PersistentVolumes
│   └── docker/                        # Docker Compose para desarrollo local y tests
│
├── .github/
│   └── workflows/                     # CI/CD — GitHub Actions
│       ├── ci-backend.yml             # Lint, tests y build de servicios Python
│       ├── ci-frontend.yml            # Lint, tests y build de clientes JS/TS
│       ├── cd-staging.yml             # Deploy automático a staging
│       ├── cd-prod.yml                # Deploy a producción (con aprobación manual)
│       ├── security-scan.yml          # Análisis estático de seguridad (SAST)
│       └── performance-tests.yml      # Pruebas de carga automatizadas
│
├── tests/                             # Pruebas transversales
│   ├── performance/                   # JMeter / Locust — pruebas de carga
│   ├── security/                      # OWASP ZAP — pruebas de seguridad
│   └── e2e/                           # Playwright — flujos completos
│
└── travelhub-experiment/              # PoC original — experimento de arquitectura (Sprint 1)
```

---

## 🏗️ Patrón arquitectónico por servicio

Cada microservicio backend sigue **Arquitectura Hexagonal (Ports & Adapters)**:

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| **API** | `src/api/v1/` | Endpoints HTTP, validación de requests/responses |
| **Dominio** | `src/domain/` | Modelos de negocio, reglas y servicios de dominio |
| **Infraestructura** | `src/infrastructure/` | BD, repositorios, cache, mensajería (Kafka) |

---

## 👥 Equipo

Angie Roa · Daniela Suárez · Esteban Heredia · Oscar Torres

> Maestría en Ingeniería de Software — MISO

---

## 🔐 Variables internas recomendadas

Para proteger comunicación interna entre servicios (`search` ↔ `inventory`) define en un `.env` local:

```env
INTERNAL_API_TOKEN=replace-with-strong-internal-token
STAFF_USER_BY_COUNTRY={"CO":1,"AR":2,"US":3}
```

Puedes usar `.env.example` como base.
