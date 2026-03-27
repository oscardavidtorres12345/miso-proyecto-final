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
    """Representa un alojamiento en los resultados de búsqueda."""

    id: int
    nombre: str
    ubicacion_geog: str
    distancia_centro_km: Optional[float]
    tipo: str
    estrellas: Optional[int]
    amenidades: List[str]
    plan_alimentacion: str
    acepta_mascotas: bool
    imagen_url: Optional[str]

    # Precio calculado para el período (con impuestos)
    precio_total: float = Field(description="Precio total del período, impuestos incluidos (COP)")
    precio_por_noche: float = Field(description="Precio promedio por noche antes de impuestos (COP)")
    moneda: str = Field(default="COP")
    numero_noches: int
    numero_adultos: int
    incluye_impuestos: bool = True
    leyenda_impuestos: str = Field(
        default="Incluye impuestos y cargos",
        description="Leyenda mostrada en la tarjeta de resultado (HU002 CA: Precio mostrado incluye impuestos)",
    )

    # Calificación
    rating: Optional[float] = Field(description="Calificación promedio (1.0-5.0)")
    numero_resenas: int = Field(default=0)
    etiqueta_rating: Optional[str] = Field(
        description="Etiqueta: Excelente, Muy bien, Bien, Regular"
    )

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    """Respuesta paginada del endpoint de búsqueda."""

    results: List[PropertyResult]
    total: int
    page: int
    page_size: int
    total_pages: int

