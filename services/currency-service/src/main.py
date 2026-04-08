import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.v1.router import api_router
from src.infrastructure.database.db_init import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Crea la DB y las tablas al arrancar. Idempotente."""
    try:
        init_db()
    except Exception as exc:  # pragma: no cover
        logger.warning("DB init skipped on startup (%s).", exc)
    yield


app = FastAPI(
    title="TravelHub – Currency Service",
    description="Servicio de tasas de cambio históricas. El fetch diario lo ejecuta el K8s CronJob.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "currency-service"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    return {"status": "ready", "service": "currency-service"}
