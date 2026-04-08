import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1.router import api_router
from src.infrastructure.database.session import engine, replica_engine
from src.infrastructure.database.db_init import init_partitioned_db
from src.infrastructure.cache.redis_cache import redis_cache

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: inicializa el schema particionado + Redis
    try:
        await init_partitioned_db(engine)
    except Exception as exc:  # pragma: no cover
        logger.warning("Partitioned DB init skipped (%s). Service may lack DB.", exc)
    await redis_cache.connect()
    yield
    # Shutdown
    await redis_cache.disconnect()
    await engine.dispose()
    await replica_engine.dispose()


app = FastAPI(
    title="TravelHub – Search Service",
    description="Servicio de búsqueda de hospedajes para TravelHub",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "search-service"}



