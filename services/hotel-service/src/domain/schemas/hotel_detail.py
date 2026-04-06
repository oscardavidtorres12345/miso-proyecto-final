"""
HU004 — Schemas de detalle de hospedaje.

Convención: snake_case en Python, camelCase en JSON (alias_generator=to_camel).
"""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

_CAMEL = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AmenityItem(BaseModel):
    """Amenidad identificada por su slug i18n (ej: 'wifi', 'pool')."""
    id: str


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


class HotelRating(BaseModel):
    """Puntaje y cantidad de reseñas del hospedaje."""
    model_config = _CAMEL

    score: Optional[float] = None
    review_count: int = 0


class RoomPrice(BaseModel):
    """Desglose de precio de una habitación para la estancia consultada."""
    model_config = _CAMEL

    total_amount: float
    price_per_night: float
    currency: str = "COP"
    nights: int
    adults: int
    includes_taxes: bool = True


class RoomResult(BaseModel):
    """Una habitación disponible en el hospedaje."""
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

    Contiene toda la información necesaria para renderizar la página de
    detalle: fotos, amenidades, horarios, habitaciones y habitación sugerida.
    """
    model_config = _CAMEL

    id: int
    name: str
    description: str
    stars: Optional[int] = None
    rating: HotelRating
    photos: List[HotelPhoto]
    amenities: List[AmenityItem]
    schedule: HotelSchedule
    rooms: List[RoomResult]
    suggested_room: Optional[SuggestedRoom] = None
