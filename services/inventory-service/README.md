# inventory-service

Servicio de inventario para disponibilidad transaccional por `room_id` y fecha.

## Endpoints
- `POST /api/v1/inventory/stock/upsert` (interno) — crea/actualiza stock base por habitacion y fecha
- `POST /api/v1/inventory/holds` — crea hold temporal (15 minutos por defecto)
- `GET /api/v1/inventory/holds/{hold_id}` — consulta hold
- `POST /api/v1/inventory/holds/{hold_id}/confirm` — confirma hold
- `POST /api/v1/inventory/holds/{hold_id}/cancel` — cancela hold
- `POST /api/v1/inventory/holds/expire` — expira holds vencidos
- `GET /api/v1/inventory/rates` — listado de gestion de tarifas (HU013), filtrado por perfil (`Authorization: Bearer <jwt>` o fallback `X-User-Id`)
- `GET /api/v1/inventory/rates/{room_id}` — detalle de tarifa por habitacion (valida perfil)
- `PUT /api/v1/inventory/rates/{room_id}` — crea/edita tarifa, disponibilidad y estado de oferta (asocia perfil autenticado)

## Notas
- Implementacion MVP en memoria con lock para consistencia concurrente.
- Estado del hold: `ACTIVE`, `CONFIRMED`, `EXPIRED`, `CANCELLED`.
- El flujo de expiracion se puede ejecutar por scheduler externo llamando `/holds/expire`.
- Sincronizacion con `search-service` habilitable con `SEARCH_SYNC_ENABLED=true`.
- Scope de tarifas por perfil: `rates` solo devuelve propiedades asociadas al `staff_user_id` autenticado.
- Primera edicion de tarifa hace bootstrap de relacion `staff_user_id <-> property_id`; luego se bloquea acceso cruzado entre hoteles.
- Migracion `0007_seed_rates_search_aligned.sql` alinea inventario con `search-db-init/02_seed.sql`:
  - room_id `1..75` (25 propiedades x 3 habitaciones)
  - ventana de stock `CURRENT_DATE + 0..9`
  - mapeo inicial staff/properties (`CO:1..10`, `AR:11..17`, `US:18..25`)
  - seed de tarifas base/oferta por tipo de habitación
