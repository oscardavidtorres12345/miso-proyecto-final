"""
HotelDetailService — servicio de dominio para HU004.

Orquesta la obtención del detalle completo de un hospedaje:
  1. Delega la consulta a HotelRepository.
  2. Retorna None si el hospedaje no existe (el endpoint responde 404).
"""
import logging
from datetime import date
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.hotel_detail import HotelDetailResponse
from src.infrastructure.repositories.hotel_repository import HotelRepository

logger = logging.getLogger(__name__)


class HotelDetailService:
    """Servicio de dominio para visualización de detalle de hospedaje."""

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
            check_in:    Fecha de entrada (opcional — afecta precio).
            check_out:   Fecha de salida  (opcional — afecta precio).
            adults:      Número de adultos para el desglose de precio.
        """
        logger.debug("Fetching hotel detail for property_id=%s", property_id)
        return await self.repository.get_by_id(property_id, check_in, check_out, adults)
