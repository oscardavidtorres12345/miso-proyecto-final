from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict

from pydantic import BaseModel


class ExchangeRateResponse(BaseModel):
    """Response schema returned by GET /api/v1/rates/latest and GET /api/v1/rates/{date}."""

    id: int
    date: date
    source: str
    quotes: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
