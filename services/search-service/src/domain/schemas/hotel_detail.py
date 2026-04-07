"""
HU004 — Schemas de detalle de hospedaje (search-service / Pod Catalog/Search).

Reutiliza AmenityItem y AccommodationRating del search-service para evitar
duplicación y mantener coherencia entre búsqueda y detalle.
"""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

# Reuse from search — same slug-based model, same rating structure
from src.domain.schemas.search import AmenityItem, AccommodationRating  # noqa: F401

_CAMEL = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class HotelPhoto(BaseModel):
    """Foto del hospedaje."""
    model_config = _CAMEL

    url: str
    alt: Optional[str] = None


class CheckInSchedule(BaseModel):
    """Horario de check-in. 'from' es keyword de Python → alias explícito."""
    model_config = ConfigDict(populate_by_name=True)

    from_time: str = Field(default="15:00", alias="from")
    to: str = "23:59"


class CheckOutSchedule(BaseModel):
    """Horario de check-out."""
    time: str = "13:00"


class HotelSchedule(BaseModel):
    """Horarios de entrada y salida del hospedaje."""
    model_config = _CAMEL

    check_in: CheckInSchedule
    check_out: CheckOutSchedule


class RoomPrice(BaseModel):
    """
    Desglose de precio de una habitación para la estancia consultada.
    Complementa AccommodationPrice (search) añadiendo price_per_night.
    """
    model_config = _CAMEL

    total_amount: float
    price_per_night: float
    currency: str = "COP"
    nights: int
    adults: int
    includes_taxes: bool = True


class RoomResult(BaseModel):
    """Habitación disponible en el hospedaje con precio desglosado."""
    model_config = _CAMEL

    id: int
    name: str
    description: str
    images: List[str]
    price: RoomPrice


class SuggestedRoom(BaseModel):
    """Habitación sugerida para el panel flotante de resumen."""
    model_config = _CAMEL

    name: str
    meal_plan: str
    total_price: float
    currency: str = "COP"


class HotelDetailResponse(BaseModel):
    """
    Respuesta completa de detalle del hospedaje (HU004).

    Usa AccommodationRating y AmenityItem del search-service para
    coherencia de tipos entre búsqueda y detalle de propiedad.
    """
    model_config = _CAMEL

    id: int
    name: str
    description: str
    stars: Optional[int] = None
    rating: AccommodationRating        # reused from search
    photos: List[HotelPhoto]
    amenities: List[AmenityItem]       # reused from search
    schedule: HotelSchedule
    rooms: List[RoomResult]
    suggested_room: Optional[SuggestedRoom] = None
