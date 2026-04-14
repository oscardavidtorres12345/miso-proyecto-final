"""
HotelDetailService — servicio de dominio para HU004 en el search-service.
"""

import logging
from datetime import date
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.hotel_detail import HotelDetailResponse
from src.domain.schemas.hotel_detail import RoomBookingDetailResponse
from src.infrastructure.repositories.hotel_repository import HotelRepository

logger = logging.getLogger(__name__)


class HotelDetailService:
    """Servicio de dominio para visualización de detalle de hospedaje (HU004)."""

    def __init__(self, session: AsyncSession):
        self.repository = HotelRepository(session)

    async def get_detail(
        self,
        property_id: int,
        check_in: Optional[date] = None,
        check_out: Optional[date] = None,
        adults: int = 2,
    ) -> Optional[HotelDetailResponse]:
        """
        Retorna el detalle completo del hospedaje o None si no existe.

        Args:
            property_id: ID de la propiedad en DB CATALOG A.
            check_in:    Fecha de entrada (afecta cálculo de precio).
            check_out:   Fecha de salida  (afecta cálculo de precio).
            adults:      Número de adultos para el desglose de precio.
        """
        logger.debug("Fetching hotel detail for property_id=%s", property_id)
        return await self.repository.get_by_id(property_id, check_in, check_out, adults)

    async def get_booking_detail_by_room(
        self,
        *,
        room_id: int,
        units: int = 1,
    ) -> Optional[RoomBookingDetailResponse]:
        logger.debug(
            "Fetching room booking detail for room_id=%s units=%s",
            room_id,
            units,
        )
        return await self.repository.get_booking_detail_by_room_id(
            room_id=room_id,
            units=units,
        )
