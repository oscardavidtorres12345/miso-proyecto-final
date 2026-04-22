import os

from fastapi import FastAPI
from fastapi import Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.api.v1.router import api_router
from src.infrastructure.database.connection import get_db

cors_config = os.getenv("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS = ["*"] if cors_config == "*" else cors_config.split(",")

app = FastAPI(
    title="Identity Service",
    version="0.1.0",
    description="Baseline endpoints for incremental sprint-based development.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False if "*" in CORS_ORIGINS else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "identity-service-0.1.0"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    return {"status": "ready", "service": "identity-service"}


@app.get("/ready/db", tags=["health"])
def ready_db(db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Database is not reachable.",
        ) from exc
    return {"status": "ready", "service": "identity-service", "database": "ok"}


app.include_router(api_router, prefix="/api/v1")
