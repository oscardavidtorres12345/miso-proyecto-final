from fastapi import FastAPI

from src.api.v1.router import api_router

app = FastAPI(
    title="Identity Service",
    version="0.1.0",
    description="Baseline de endpoints para desarrollo incremental por sprints.",
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "identity-service"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    return {"status": "ready", "service": "identity-service"}


app.include_router(api_router, prefix="/api/v1")
