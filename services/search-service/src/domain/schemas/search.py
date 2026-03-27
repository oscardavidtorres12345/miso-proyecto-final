from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# REQUEST
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    """Parámetros de búsqueda del endpoint GET /api/v1/search/properties."""

    # Campos obligatorios
    destination: str = Field(..., description="Ciudad o destino (texto libre)")
    check_in: date = Field(..., description="Fecha de entrada")
    check_out: date = Field(..., description="Fecha de salida")

    # Huéspedes
    adults: int = Field(default=1, ge=1, description="Número de adultos (≥13 años)")
    children: int = Field(default=0, ge=0, description="Número de niños (0-12 años)")
    rooms: int = Field(default=1, ge=1, description="Número de habitaciones requeridas")
    pets: bool = Field(default=False, description="¿Viaja con mascotas?")

    # Filtros de precio
    price_min: Optional[float] = Field(default=None, ge=0, description="Precio mínimo por noche (COP)")
    price_max: Optional[float] = Field(default=None, ge=0, description="Precio máximo por noche (COP)")

    # Filtros adicionales
    amenities: Optional[List[str]] = Field(
        default=None,
        description="Amenidades requeridas: Estacionamiento, Piscina, Acepta mascotas, "
                    "Servicios para niños, Bañera, Restaurante",
    )
    accommodation_type: Optional[List[str]] = Field(
        default=None,
        description="Tipo de alojamiento: Hotel, Casa, Cabaña, Hostal, Villa, Resort",
    )
    stars: Optional[List[int]] = Field(
        default=None,
        description="Categoría de estrellas requeridas (1-5)",
    )
    meal_plan: Optional[str] = Field(
        default=None,
        description="Plan de alimentación: Ninguno, Desayuno, Desayuno buffet, All inclusive",
    )

    # Particionamiento geográfico (HU023 — PF-284)
    # Cuando se especifica, activa partition pruning en PostgreSQL (LIST PARTITION BY pais).
    # Valores ISO 3166-1 alpha-2: CO, AR, US. Sin valor → búsqueda global (todos los shards).
    country: Optional[str] = Field(
        default=None,
        description="Código ISO del país (CO, AR, US). Activa partition pruning en el shard correcto.",
    )

    # Paginación
    page: int = Field(default=1, ge=1, description="Número de página")
    page_size: int = Field(default=10, ge=1, le=50, description="Resultados por página")

    @model_validator(mode="after")
    def validate_dates(self) -> "SearchRequest":
        if self.check_out <= self.check_in:
            raise ValueError("check_out debe ser posterior a check_in")
        return self


# ---------------------------------------------------------------------------
# RESPONSE
# ---------------------------------------------------------------------------

class PropertyResult(BaseModel):
    """Represents an accommodation in search results."""

    id: int
    name: str
    location: str
    distance_to_center_km: Optional[float]
    accommodation_type: str
    stars: Optional[int]
    amenities: List[str]
    meal_plan: str
    pets_allowed: bool
    image_url: Optional[str]

    # Price calculated for the stay period (taxes included)
    # Frontend renders: "{nights} noches · {adults} adultos · Incluye impuestos y cargos"
    total_price: float = Field(description="Total price for the period, taxes included (COP)")
    price_per_night: float = Field(description="Average price per night before taxes (COP)")
    currency: str = Field(default="COP")
    nights: int
    adults: int
    taxes_included: bool = True

    # Rating
    rating: Optional[float] = Field(description="Average rating (1.0-5.0)")
    review_count: int = Field(default=0)
    rating_label: Optional[str] = Field(
        description="Label: Excelente, Muy bien, Bien, Regular"
    )

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    """Respuesta paginada del endpoint de búsqueda."""

    results: List[PropertyResult]
    total: int
    page: int
    page_size: int
    total_pages: int

