# payment-service

Servicio de procesamiento de pagos con integración de Stripe para TravelHub.

## 🎯 Descripción

Este microservicio maneja el procesamiento seguro de pagos utilizando Stripe como proveedor certificado PCI-DSS. Implementa una arquitectura hexagonal que garantiza:

- ✅ **Seguridad PCI-DSS**: Los datos de tarjeta NUNCA pasan por nuestros servidores
- ✅ **Backend-First**: Trazabilidad completa desde el inicio
- ✅ **Idempotencia**: Manejo correcto de reintentos y webhooks duplicados
- ✅ **Trazabilidad**: Auditoría completa de todas las transacciones

## 🏗️ Arquitectura Hexagonal

```
src/
├── api/v1/                      # Adaptadores de entrada (HTTP)
│   ├── endpoints.py             # Controllers FastAPI
│   └── router.py
├── domain/                      # Núcleo del negocio
│   ├── schemas.py               # DTOs (Pydantic)
│   └── services/                # Lógica de negocio
│       ├── payment_service.py   # Gestión de pagos
│       └── webhook_service.py   # Gestión de webhooks
└── infrastructure/              # Adaptadores de salida
    ├── database/                # Persistencia
    │   ├── models.py            # Entidades SQLAlchemy
    │   ├── connection.py        # DB setup
    │   └── migrations/          # SQL migrations
    └── clients.py               # Clientes externos (Stripe, Booking)
```

## 📊 Modelo de Datos

- **payment_transaction**: Transacciones de pago
- **webhook_event**: Log de webhooks de Stripe (idempotencia)
- **payment_method**: Métodos de pago guardados (metadata, NO datos de tarjeta)

## 🔐 Flujo de Pago (Backend-First)

1. **Frontend** → `POST /api/v1/payments/intent` → **Backend**
2. **Backend** crea registro en DB (`status=PENDING`)
3. **Backend** crea PaymentIntent en Stripe
4. **Backend** → `client_secret` → **Frontend**
5. **Frontend** renderiza Stripe Elements (datos van directo a Stripe)
6. **Stripe** → Webhook → **Backend** (`payment_intent.succeeded`)
7. **Backend** actualiza DB (`status=COMPLETED`) y confirma booking
8. **Frontend** hace polling → `GET /api/v1/payments/{id}/status`

## 🚀 Endpoints

### Stripe Integration (Nuevos)

- `POST /api/v1/payments/intent` - Crear PaymentIntent (HU008)
- `GET /api/v1/payments/{payment_id}/status` - Consultar estado
- `POST /api/v1/payments/webhook` - Recibir webhooks de Stripe

### Legacy (Sprint 2/3)

- `POST /api/v1/payments/authorize` (HU008)
- `POST /api/v1/payments/fraud/screen` (HU024)
- `POST /api/v1/payments/{payment_id}/refund` (HU009)
- `GET /api/v1/payments/fx/quote` (HU020)

## ⚙️ Configuración

### 1. Variables de Entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configurar las claves de Stripe (obtener de https://dashboard.stripe.com/test/apikeys):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Desde webhooks dashboard
```

### 2. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 3. Ejecutar Migraciones

Las migraciones se ejecutan automáticamente al iniciar el servicio.

### 4. Ejecutar el Servicio

```bash
uvicorn src.main:app --reload --port 8005
```

## 🧪 Testing

### Tarjetas de Prueba de Stripe

```
Éxito:           4242 4242 4242 4242
Rechazo:         4000 0000 0000 0002
Requiere 3DS:    4000 0025 0000 3155
CVV:             Cualquier 3 dígitos
Fecha:           Cualquier fecha futura
```

### Ejecutar Tests

```bash
# Tests unitarios
pytest tests/unit -v

# Tests de integración
pytest tests/integration -v

# Coverage
pytest --cov=src tests/
```

## 🔧 Configurar Webhooks en Desarrollo

### Opción 1: Stripe CLI (Recomendado)

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a localhost
stripe listen --forward-to localhost:8005/api/v1/payments/webhook

# Copiar el webhook secret que aparece en la terminal
# Actualizar STRIPE_WEBHOOK_SECRET en .env
```

### Opción 2: ngrok

```bash
# Instalar ngrok
brew install ngrok

# Exponer puerto local
ngrok http 8005

# Copiar la URL pública (ej: https://abc123.ngrok.io)
# Configurar webhook en Stripe Dashboard:
# https://dashboard.stripe.com/test/webhooks
# URL: https://abc123.ngrok.io/api/v1/payments/webhook
```

## 📝 Eventos de Stripe Manejados

- `payment_intent.succeeded` → Marca pago como COMPLETED y confirma booking
- `payment_intent.payment_failed` → Marca pago como FAILED

## 🔍 Estados de Pago

```
PENDING          → Creado en DB, esperando PaymentIntent
PROCESSING       → PaymentIntent creado en Stripe
REQUIRES_ACTION  → Requiere 3D Secure
COMPLETED        → ✅ Pago exitoso
FAILED           → ❌ Rechazado
CANCELLED        → Usuario canceló
REFUNDED         → Reembolsado (Sprint 3)
```

## 🛡️ Seguridad

- ✅ Datos de tarjeta NUNCA llegan al backend (Stripe Elements)
- ✅ Validación de webhook signatures (Stripe-Signature header)
- ✅ Idempotencia en webhooks (previene procesamiento duplicado)
- ✅ Metadata linking (payment_id, booking_id en Stripe)
- ✅ HTTPS obligatorio en producción
- ✅ Variables sensibles en environment (NUNCA en código)

## 📚 Documentación Adicional

- [Stripe Elements Documentation](https://stripe.com/docs/payments/elements)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PCI Compliance](https://stripe.com/docs/security/guide)
