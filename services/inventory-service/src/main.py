import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1.router import api_router
from src.infrastructure.database.connection import init_db

app = FastAPI(
    title="Inventory Service",
    version="0.1.0",
    description="Inventory and hold management for reservation flow.",
)

cors_config = os.getenv("CORS_ORIGINS", "*")
CORS_ORIGINS = ["*"] if cors_config == "*" else cors_config.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False if "*" in CORS_ORIGINS else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "inventory-service"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    return {"status": "ready", "service": "inventory-service"}


app.include_router(api_router, prefix="/api/v1")
