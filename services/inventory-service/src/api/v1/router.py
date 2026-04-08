from fastapi import APIRouter

from src.api.v1.endpoints import router as inventory_router

api_router = APIRouter()
api_router.include_router(inventory_router, tags=["inventory"])
