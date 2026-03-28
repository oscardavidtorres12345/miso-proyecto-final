from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.schemas.search import (
    FilterOption,
    FiltersResponse,
    SearchRequest,
    SearchResponse,
)
from src.domain.services.search_service import SearchService
from src.infrastructure.database.session import get_read_db

router = APIRouter()

# ---------------------------------------------------------------------------
# Static filter catalogue (slugs match frontend i18n keys)
# ---------------------------------------------------------------------------

_ACCOMMODATION_TYPES = [
    FilterOption(id="hotel"),
    FilterOption(id="house"),
    FilterOption(id="cabin"),
    FilterOption(id="hostel"),
    FilterOption(id="villa"),
    FilterOption(id="resort"),
]

_SERVICES = [
    FilterOption(id="parking"),
    FilterOption(id="pool"),
    FilterOption(id="pets"),
    FilterOption(id="kids"),
    FilterOption(id="bathtub"),
    FilterOption(id="restaurant"),
    FilterOption(id="spa"),
    FilterOption(id="gym"),
    FilterOption(id="wifi"),
    FilterOption(id="ac"),
]

_MEALS = [
    FilterOption(id="breakfast"),
    FilterOption(id="buffet"),
    FilterOption(id="allinclusive"),
]

_STARS = [
    FilterOption(id="5"),
    FilterOption(id="4"),
    FilterOption(id="3"),
    FilterOption(id="2"),
    FilterOption(id="1"),
]


# ---------------------------------------------------------------------------
# GET /filters
# ---------------------------------------------------------------------------

@router.get(
    "/filters",
    response_model=FiltersResponse,
    response_model_by_alias=True,
    summary="Available search filter options",
    description=(
        "Returns all valid filter option IDs for the search UI. "
        "IDs are i18n slugs — the frontend resolves labels via t() calls. "
        "Implements HU002: Accommodation Search."
    ),
)
def get_filters() -> FiltersResponse:
    return FiltersResponse(
        accommodation_types=_ACCOMMODATION_TYPES,
        services=_SERVICES,
        meals=_MEALS,
        stars=_STARS,
    )


# ---------------------------------------------------------------------------
# GET /properties
# ---------------------------------------------------------------------------

@router.get(
    "/properties",
    response_model=SearchResponse,
    response_model_by_alias=True,
    summary="Search available accommodations",
    description=(
        "Searches available accommodations by destination, dates, guests, and optional filters. "
        "Returns total price with taxes included (e.g. 19% VAT for Colombia). "
        "Implements HU002: Accommodation Search."
    ),
)
async def search_properties(
    # Required fields
    destination: str = Query(..., description="City or destination (free text)", examples=["Cartagena"]),
    check_in: date = Query(..., description="Check-in date (YYYY-MM-DD)", examples=["2026-04-01"]),
    check_out: date = Query(..., description="Check-out date (YYYY-MM-DD)", examples=["2026-04-05"]),
    # Guests
    adults: int = Query(default=1, ge=1, description="Adults (≥13 years)"),
    children: int = Query(default=0, ge=0, description="Children (0-12 years)"),
    rooms: int = Query(default=1, ge=1, description="Number of rooms required"),
    pets: bool = Query(default=False, description="Travelling with pets?"),
    # Price filters
    price_min: Optional[float] = Query(default=None, ge=0, description="Minimum price per night"),
    price_max: Optional[float] = Query(default=None, ge=0, description="Maximum price per night"),
    # Additional filters — slugs matching i18n keys
    amenities: Optional[List[str]] = Query(
        default=None,
        description="Required amenities (slugs): parking, pool, pets, kids, bathtub, "
                    "restaurant, spa, gym, wifi, ac",
    ),
    accommodation_type: Optional[List[str]] = Query(
        default=None,
        description="Accommodation type (slugs): hotel, house, cabin, hostel, villa, resort",
    ),
    stars: Optional[List[int]] = Query(
        default=None,
        description="Required star categories (1-5)",
    ),
    meal_plan: Optional[str] = Query(
        default=None,
        description="Meal plan (slug): none, breakfast, buffet, allinclusive",
    ),
    # Geographic partitioning — HU023 (PF-284)
    country: Optional[str] = Query(
        default=None,
        description="Country ISO code (CO, AR, US). Activates partition pruning on the correct shard.",
        examples=["CO"],
    ),
    # Pagination
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=50, description="Results per page"),
    # Read-replica session (PF-281): search queries go to the read replica
    db: AsyncSession = Depends(get_read_db),
):
    # Validate required fields (CA: Required field validation)
    if not destination or not destination.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Field 'destination' is required.",
        )
    if check_out <= check_in:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="'check_out' must be a date after 'check_in'.",
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
        country=country,
        page=page,
        page_size=page_size,
    )

    service = SearchService(db)
    try:
        return await service.search_properties(req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(exc)}",
        )

