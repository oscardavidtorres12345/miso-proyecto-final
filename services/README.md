# Services Baseline

Estructura base de microservicios para desarrollo incremental por sprints.

## Servicios
- `identity-service`: autenticacion/autorizacion web, portal y movil.
- `search-service`: busqueda y performance de catalogo.
- `hotel-service`: detalle de propiedad, tarifas y analitica.
- `booking-service`: hold, cotizacion, confirmacion, reservas y flujos moviles.
- `payment-service`: pagos, antifraude, reembolsos y conversion.

## Convenciones
- Endpoints versionados bajo `/api/v1`.
- Cada endpoint stub referencia `sprint` y `hu_id`.
- `GET /health` y `GET /ready` en todos los servicios.
- Baseline de pruebas smoke con `pytest` en `tests/`.

## Ejecucion local de un servicio
```bash
cd services/identity-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8001
```

## Ejecucion local de todos
```bash
cd infrastructure/docker
docker compose -f docker-compose.services.yml up --build
```
