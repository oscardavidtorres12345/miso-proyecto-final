from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1.router import api_router
from src.infrastructure.database.connection import init_db

app = FastAPI(
    title="Payment Service",
    version="0.1.0",
    description="Payment processing service with Stripe integration for TravelHub.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database (run migrations)
init_db()


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "payment-service"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    return {"status": "ready", "service": "payment-service"}


app.include_router(api_router, prefix="/api/v1")
