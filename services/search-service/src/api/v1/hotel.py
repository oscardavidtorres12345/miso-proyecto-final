"""
HU004 — Endpoint de detalle de hospedaje (search-service / Pod Catalog/Search).
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.hotel_detail import HotelDetailResponse
from src.domain.services.hotel_detail_service import HotelDetailService
from src.infrastructure.database.session import get_db

router = APIRouter()


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
