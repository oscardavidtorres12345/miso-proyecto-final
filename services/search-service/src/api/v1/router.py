from fastapi import APIRouter

from src.api.v1.endpoints import router as stub_router   # stubs sprint 1 (HU022, HU016)
from src.api.v1.search import router as search_router    # HU002 — búsqueda real
from src.api.v1.hotel import router as hotel_router      # HU004 — detalle de hospedaje

api_router = APIRouter()
api_router.include_router(stub_router, tags=["search"])                       # /search/...
api_router.include_router(search_router, prefix="/search", tags=["search"])   # /search/filters, /search/properties
api_router.include_router(hotel_router, prefix="/hotels", tags=["hotels"])    # /hotels/{id}
