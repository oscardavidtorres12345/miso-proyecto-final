# inventory-service

Servicio de inventario para disponibilidad transaccional por `room_id` y fecha.

## Endpoints
- `POST /api/v1/inventory/stock/upsert` (interno) — crea/actualiza stock base por habitacion y fecha
- `POST /api/v1/inventory/holds` — crea hold temporal (15 minutos por defecto)
- `GET /api/v1/inventory/holds/{hold_id}` — consulta hold
- `POST /api/v1/inventory/holds/{hold_id}/confirm` — confirma hold
- `POST /api/v1/inventory/holds/{hold_id}/cancel` — cancela hold
- `POST /api/v1/inventory/holds/expire` — expira holds vencidos
- `GET /api/v1/inventory/rates` — listado de gestion de tarifas (HU013)
- `GET /api/v1/inventory/rates/{room_id}` — detalle de tarifa por habitacion
- `PUT /api/v1/inventory/rates/{room_id}` — crea/edita tarifa, disponibilidad y estado de oferta

## Notas
- Implementacion MVP en memoria con lock para consistencia concurrente.
- Estado del hold: `ACTIVE`, `CONFIRMED`, `EXPIRED`, `CANCELLED`.
- El flujo de expiracion se puede ejecutar por scheduler externo llamando `/holds/expire`.
- Sincronizacion con `search-service` habilitable con `SEARCH_SYNC_ENABLED=true`.
