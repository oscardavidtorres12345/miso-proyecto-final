from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas import (
    AnalyticsResponse,
    RateRequest,
    ReservationDetailResponse,
    ReservationDecisionRequest,
)
from src.domain.schemas.hotel_detail import HotelDetailResponse
from src.domain.services.hotel_detail_service import HotelDetailService
from src.infrastructure.database.session import get_db

router = APIRouter(prefix="/hotels")


@router.get(
    "/{hotel_id}",
    response_model=HotelDetailResponse,
    response_model_by_alias=True,
    summary="Detalle de hospedaje",
    description=(
        "Retorna el detalle completo de un hospedaje: fotos, amenidades, "
        "horarios de check-in/out y habitaciones disponibles con precios. "
        "Implementa HU004: Visualización de detalles de propiedad."
    ),
)
async def hotel_detail(
    hotel_id: int,
    check_in: Optional[date] = Query(
        default=None,
        description="Fecha de entrada (YYYY-MM-DD). Afecta el cálculo de precio.",
    ),
    check_out: Optional[date] = Query(
        default=None,
        description="Fecha de salida (YYYY-MM-DD). Afecta el cálculo de precio.",
    ),
    adults: int = Query(default=2, ge=1, description="Número de adultos."),
    db: AsyncSession = Depends(get_db),
) -> HotelDetailResponse:
    service = HotelDetailService(db)
    result = await service.get_detail(hotel_id, check_in, check_out, adults)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hotel with id={hotel_id} not found.",
        )
    return result


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
