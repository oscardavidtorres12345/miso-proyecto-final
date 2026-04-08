from fastapi import APIRouter

from src.api.v1.endpoints import router as rates_router

api_router = APIRouter()
api_router.include_router(rates_router, tags=["rates"])
