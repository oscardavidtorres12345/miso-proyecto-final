"""
Currency-service endpoints.

GET /api/v1/rates/latest      — returns the most recent snapshot
GET /api/v1/rates/{date}      — returns the snapshot for a specific date (YYYY-MM-DD)
POST /api/v1/rates/fetch      — manually triggers a fetch (admin/ops use, no API key exposed)
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.domain.schemas import ExchangeRateResponse
from src.domain.services.exchange_rate_service import ExchangeRateService
from src.infrastructure.database.session import get_db

router = APIRouter(prefix="/rates")


@router.get("/latest", response_model=ExchangeRateResponse)
def get_latest_rates(db: Session = Depends(get_db)) -> ExchangeRateResponse:
    """Returns the most recent exchange rate snapshot stored in the DB."""
    snapshot = ExchangeRateService(db).get_latest()
    if snapshot is None:
        raise HTTPException(status_code=404, detail="No exchange rate snapshots available yet.")
    return ExchangeRateResponse.model_validate(snapshot)


@router.get("/{snapshot_date}", response_model=ExchangeRateResponse)
def get_rates_by_date(
    snapshot_date: date,
    db: Session = Depends(get_db),
) -> ExchangeRateResponse:
    """Returns the exchange rate snapshot for a specific date (YYYY-MM-DD)."""
    snapshot = ExchangeRateService(db).get_by_date(snapshot_date)
    if snapshot is None:
        raise HTTPException(
            status_code=404,
            detail=f"No exchange rate snapshot found for date {snapshot_date}.",
        )
    return ExchangeRateResponse.model_validate(snapshot)


@router.post("/fetch", status_code=202)
def trigger_fetch(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
) -> dict:
    """
    Dispara manualmente un fetch desde APILayer. Útil para backfill o primera carga.
    En producción el fetch lo ejecuta el K8s CronJob diariamente a las 06:00 UTC.
    """
    snapshot = ExchangeRateService(db).fetch_and_store(target_date)
    return {"status": "fetched", "date": str(snapshot.date), "pairs": len(snapshot.quotes)}
