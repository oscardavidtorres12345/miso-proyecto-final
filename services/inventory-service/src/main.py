from fastapi import FastAPI

from src.api.v1.router import api_router

app = FastAPI(
    title="Inventory Service",
    version="0.1.0",
    description="Inventory and hold management for reservation flow.",
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "inventory-service"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    return {"status": "ready", "service": "inventory-service"}


app.include_router(api_router, prefix="/api/v1")
