"""
Schemas del hotel-service.
Exporta todos los schemas usados en los endpoints (stubs de sprints futuros
y el schema real de HU004).
"""
from typing import Literal

from pydantic import BaseModel

# Re-export del schema real (HU004)
from src.domain.schemas.hotel_detail import HotelDetailResponse  # noqa: F401


# ---------------------------------------------------------------------------
# Schemas de sprints futuros (stubs)
# ---------------------------------------------------------------------------

class RateRequest(BaseModel):
    hotel_id: str
    room_type: str
    base_price: float
    currency: str


class ReservationDecisionRequest(BaseModel):
    decision: Literal["confirmed", "rejected"]


class ReservationDetailResponse(BaseModel):
    reservation_id: str
    status: str
    sprint: int
    hu_id: str


class AnalyticsResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    data: dict
