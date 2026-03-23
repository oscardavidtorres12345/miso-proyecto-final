from fastapi import APIRouter

from src.domain.schemas import (
    AnalyticsResponse,
    HotelDetailResponse,
    RateRequest,
    ReservationDetailResponse,
    ReservationDecisionRequest,
)

router = APIRouter(prefix="/hotels")


@router.get("/{hotel_id}", response_model=HotelDetailResponse)
def hotel_detail(hotel_id: str) -> HotelDetailResponse:
    return HotelDetailResponse(
        hotel_id=hotel_id,
        status="not_implemented",
        sprint=1,
        hu_id="HU004",
    )


@router.post("/rates")
def create_rate(payload: RateRequest) -> dict:
    _ = payload
    return {"status": "not_implemented", "sprint": 2, "hu_id": "HU013"}


@router.get("/reservations/{reservation_id}", response_model=ReservationDetailResponse)
def reservation_detail(reservation_id: str) -> ReservationDetailResponse:
    return ReservationDetailResponse(
        reservation_id=reservation_id,
        status="not_implemented",
        sprint=2,
        hu_id="HU014",
    )


@router.patch("/reservations/{reservation_id}/decision")
def reservation_decision(
    reservation_id: str,
    payload: ReservationDecisionRequest,
) -> dict:
    _ = payload
    return {
        "reservation_id": reservation_id,
        "status": "not_implemented",
        "sprint": 2,
        "hu_id": "HU014",
    }


@router.get("/analytics/dashboard", response_model=AnalyticsResponse)
def dashboard() -> AnalyticsResponse:
    return AnalyticsResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU011",
        data={},
    )


@router.get("/analytics/revenue/monthly", response_model=AnalyticsResponse)
def monthly_revenue() -> AnalyticsResponse:
    return AnalyticsResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU012",
        data={},
    )


@router.get("/analytics/feedback", response_model=AnalyticsResponse)
def customer_feedback() -> AnalyticsResponse:
    return AnalyticsResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU021",
        data={},
    )
