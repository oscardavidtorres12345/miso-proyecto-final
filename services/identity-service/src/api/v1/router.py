from fastapi import APIRouter

from src.api.v1.endpoints import router as identity_router

api_router = APIRouter()
api_router.include_router(identity_router, tags=["identity"])
