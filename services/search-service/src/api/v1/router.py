from fastapi import APIRouter

from src.api.v1.endpoints import router as stub_router  # stubs sprint 1 (HU022, HU016)
from src.api.v1.search import router as search_router  # HU002 — búsqueda real
from src.api.v1.hotel import router as hotel_router  # HU004 — detalle de hospedaje
from src.api.v1.internal_sync import router as internal_sync_router
from src.api.v1.internal_catalog import router as internal_catalog_router

api_router = APIRouter()
api_router.include_router(stub_router, tags=["search"])  # /search/...
api_router.include_router(
    search_router, prefix="/search", tags=["search"]
)  # /search/filters, /search/properties
api_router.include_router(
    hotel_router, prefix="/hotels", tags=["hotels"]
)  # /hotels/{id}
api_router.include_router(
    internal_sync_router,
    tags=["internal-sync"],
)  # /internal/sync/* for cross-service consistency
api_router.include_router(
    internal_catalog_router,
    tags=["internal-catalog"],
)  # /internal/catalog/* for structural catalog sync
