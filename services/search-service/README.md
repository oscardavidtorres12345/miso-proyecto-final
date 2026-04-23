# search-service

Base de endpoints de busqueda y performance por sprints.

## Sprint 1
- `GET /api/v1/search/hotels` (HU002)
- `GET /api/v1/search/performance/status` (HU023)

## Sprint 2
- `GET /api/v1/search/ops/autoscaling/signal` (HU022)

## Sprint 3
- `GET /api/v1/search/mobile` (HU016)

## Internal sync
- `PUT /api/v1/internal/sync/inventory/rooms/{room_id}` — upsert de disponibilidad por fecha
- `PUT /api/v1/internal/sync/rates/rooms/{room_id}` — upsert de tarifas por fecha
- `GET /api/v1/internal/catalog/rooms` — snapshot estructural del catálogo (room_id, property_id, property_name, room_type, country)
- `POST /api/v1/internal/catalog/rooms` — crea habitación en catálogo y retorna `room_id` para sincronización cross-service
- Seguridad interna: los endpoints `/api/v1/internal/*` requieren header `X-Internal-Token` (env `INTERNAL_API_TOKEN`).
