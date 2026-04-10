from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1.router import api_router
from src.infrastructure.database.connection import init_db

app = FastAPI(
    title="Booking Service",
    version="0.1.0",
    description="Baseline de endpoints para desarrollo incremental por sprints.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "booking-service"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    return {"status": "ready", "service": "booking-service"}


app.include_router(api_router, prefix="/api/v1")
