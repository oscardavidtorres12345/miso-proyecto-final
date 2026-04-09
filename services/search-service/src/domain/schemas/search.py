from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

# Shared config: snake_case in Python, camelCase in JSON
_CAMEL = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ---------------------------------------------------------------------------
# REQUEST
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    """Search parameters for GET /api/v1/search/properties."""

    # Required fields
    destination: str = Field(..., description="City or destination (free text)")
    check_in: date = Field(..., description="Check-in date")
    check_out: date = Field(..., description="Check-out date")

    # Guests
    adults: int = Field(default=1, ge=1, description="Number of adults (≥13 years)")
    children: int = Field(
        default=0, ge=0, description="Number of children (0-12 years)"
    )
    rooms: int = Field(default=1, ge=1, description="Number of rooms required")
    pets: bool = Field(default=False, description="Travelling with pets?")

    # Price filters — total stay price (taxes included), NOT per night.
    # Must match AccommodationPrice.amount = price_per_night * nights * (1 + tax_rate).
    price_min: Optional[float] = Field(
        default=None, ge=0, description="Minimum total price for the stay (taxes included)"
    )
    price_max: Optional[float] = Field(
        default=None, ge=0, description="Maximum total price for the stay (taxes included)"
    )

    # Additional filters — all values are i18n slugs
    amenities: Optional[List[str]] = Field(
        default=None,
        description="Required amenities (slugs): parking, pool, pets, kids, bathtub, "
        "restaurant, spa, gym, wifi, ac",
    )
    accommodation_type: Optional[List[str]] = Field(
        default=None,
        description="Accommodation type (slugs): hotel, house, cabin, hostel, villa, resort",
    )
    stars: Optional[List[int]] = Field(
        default=None,
        description="Required star categories (1-5)",
    )
    # has_breakfast: matches ALL plans that include breakfast (breakfast, buffet, allinclusive).
    # Use this for a generic "includes breakfast" checkbox in the UI.
    has_breakfast: Optional[bool] = Field(
        default=None,
        description="If true, only return properties where breakfast is included "
                    "(meal_plan in: breakfast, buffet, allinclusive).",
    )
    # meal_plan: exact match for a specific meal plan slug.
    # Ignored when has_breakfast=True.
    meal_plan: Optional[str] = Field(
        default=None,
        description="Exact meal plan (slug): breakfast, buffet, allinclusive. "
                    "Prefer has_breakfast=true for a generic breakfast filter.",
    )

    # Geographic partitioning (HU023 — PF-284)
    # When specified, activates partition pruning in PostgreSQL (LIST PARTITION BY country).
    # ISO 3166-1 alpha-2 values: CO, AR, US. Without value → global search (all shards).
    country: Optional[str] = Field(
        default=None,
        description="Country ISO code (CO, AR, US). Activates partition pruning on the correct shard.",
    )

    # Pagination
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=10, ge=1, le=50, description="Results per page")

    @model_validator(mode="after")
    def validate_dates(self) -> "SearchRequest":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


# ---------------------------------------------------------------------------
# RESPONSE — nested models (camelCase JSON output)
# ---------------------------------------------------------------------------


class AmenityItem(BaseModel):
    """An amenity identified by its i18n slug (e.g. 'wifi', 'pool')."""

    id: str


class AccommodationRating(BaseModel):
    """Rating summary for an accommodation."""

    model_config = _CAMEL

    score: Optional[float] = None
    review_count: int = 0


class AccommodationPrice(BaseModel):
    """Price breakdown for the searched stay."""

    model_config = _CAMEL

    amount: float = Field(description="Total price for the stay period, taxes included")
    currency: str = "COP"
    nights: int
    adults: int
    includes_taxes: bool = True


class PropertyResult(BaseModel):
    """A single accommodation returned by the search endpoint.

    Matches the frontend Accommodation interface from clients/web-app/src/types/accommodation.ts.
    Serialized as camelCase JSON.
    """

    model_config = _CAMEL

    id: int
    room_id: int = Field(
        description="Reservable room identifier for hold/booking flows"
    )
    name: str
    image: Optional[str] = None
    distance_from_center: Optional[float] = None
    stars: Optional[int] = None
    rating: AccommodationRating
    amenities: List[AmenityItem]
    has_breakfast: bool
    price: AccommodationPrice


class SearchResponse(BaseModel):
    """Paginated response from the search endpoint."""

    model_config = _CAMEL

    results: List[PropertyResult]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# FILTER RESPONSE
# ---------------------------------------------------------------------------


class FilterOption(BaseModel):
    """A filter option identified by its i18n slug."""

    id: str


class FiltersResponse(BaseModel):
    """Available filter options for the search UI.

    All option IDs are i18n slugs — the frontend resolves labels via t() calls.
    """

    model_config = _CAMEL

    accommodation_types: List[FilterOption]
    services: List[FilterOption]
    meals: List[FilterOption]
    stars: List[FilterOption]
