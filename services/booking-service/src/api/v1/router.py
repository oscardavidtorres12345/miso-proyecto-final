from fastapi import APIRouter

from src.api.v1.endpoints import router as booking_router

api_router = APIRouter()
api_router.include_router(booking_router, tags=["booking"])
