from fastapi import APIRouter

from src.api.v1.endpoints import router as payment_router

api_router = APIRouter()
api_router.include_router(payment_router, tags=["payment"])
