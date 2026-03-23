from typing import Literal

from pydantic import BaseModel


class HotelDetailResponse(BaseModel):
    hotel_id: str
    status: str
    sprint: int
    hu_id: str


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
