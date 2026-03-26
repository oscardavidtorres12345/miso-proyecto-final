from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.search import SearchRequest, SearchResponse
from src.domain.services.search_service import SearchService
from src.infrastructure.database.session import get_read_db

router = APIRouter()


@router.get(
    "/properties",
    response_model=SearchResponse,
    summary="Buscar hospedajes disponibles",
    description=(
        "Busca alojamientos disponibles según destino, fechas, huéspedes y filtros opcionales. "
        "Retorna precio total con impuestos incluidos (IVA Colombia 19%). "
        "Implementa HU002: Búsqueda de Hospedajes."
    ),
)
async def search_properties(
    # Campos obligatorios
    destination: str = Query(..., description="Ciudad o destino (texto libre)", examples=["Cartagena"]),
    check_in: date = Query(..., description="Fecha de entrada (YYYY-MM-DD)", examples=["2026-04-01"]),
    check_out: date = Query(..., description="Fecha de salida (YYYY-MM-DD)", examples=["2026-04-05"]),
    # Huéspedes
    adults: int = Query(default=1, ge=1, description="Adultos (≥13 años)"),
    children: int = Query(default=0, ge=0, description="Niños (0-12 años)"),
    rooms: int = Query(default=1, ge=1, description="Número de habitaciones requeridas"),
    pets: bool = Query(default=False, description="¿Viaja con mascotas?"),
    # Filtros de precio
    price_min: Optional[float] = Query(default=None, ge=0, description="Precio mínimo/noche (COP)"),
    price_max: Optional[float] = Query(default=None, ge=0, description="Precio máximo/noche (COP)"),
    # Filtros adicionales
    amenities: Optional[List[str]] = Query(
        default=None,
        description="Amenidades: Estacionamiento, Piscina, Acepta mascotas, "
                    "Servicios para niños, Bañera, Restaurante",
    ),
    accommodation_type: Optional[List[str]] = Query(
        default=None,
        description="Tipo: Hotel, Casa, Cabaña, Hostal, Villa, Resort",
    ),
    stars: Optional[List[int]] = Query(
        default=None,
        description="Estrellas requeridas (1-5)",
    ),
    meal_plan: Optional[str] = Query(
        default=None,
        description="Plan alimentación: Ninguno, Desayuno, Desayuno buffet, All inclusive",
    ),
    # Paginación
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=10, ge=1, le=50, description="Resultados por página"),
    # Read-replica session (PF-281): búsquedas van a réplica de lectura
    db: AsyncSession = Depends(get_read_db),
):
    # Validación de campos obligatorios (CA: Validación de campos obligatorios)
    if not destination or not destination.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El campo 'destination' es obligatorio.",
        )
    if check_out <= check_in:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="'check_out' debe ser una fecha posterior a 'check_in'.",
        )

    req = SearchRequest(
        destination=destination,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        children=children,
        rooms=rooms,
        pets=pets,
        price_min=price_min,
        price_max=price_max,
        amenities=amenities,
        accommodation_type=accommodation_type,
        stars=stars,
        meal_plan=meal_plan,
        page=page,
        page_size=page_size,
    )

    service = SearchService(db)
    try:
        return await service.search_properties(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al realizar la búsqueda: {str(exc)}",
        )

