from fastapi import APIRouter

from src.api.v1.endpoints import router as hotel_router

api_router = APIRouter()
api_router.include_router(hotel_router, tags=["hotel"])
