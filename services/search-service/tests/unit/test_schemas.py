"""
Unit tests for Pydantic search schemas (HU002).
Validates validation logic without external dependencies.
"""

import pytest
from datetime import date, timedelta
from pydantic import ValidationError

from src.domain.schemas.search import (
    AccommodationPrice,
    AccommodationRating,
    AmenityItem,
    PropertyResult,
    SearchRequest,
    SearchResponse,
)

TODAY = date.today()
CHECK_IN = TODAY + timedelta(days=10)
CHECK_OUT = TODAY + timedelta(days=14)


# ---------------------------------------------------------------------------
# SearchRequest — required fields and validations
# ---------------------------------------------------------------------------


def test_search_request_valid_minimal():
    req = SearchRequest(destination="Cartagena", check_in=CHECK_IN, check_out=CHECK_OUT)
    assert req.destination == "Cartagena"
    assert req.adults == 1
    assert req.children == 0
    assert req.rooms == 1
    assert req.pets is False
    assert req.page == 1
    assert req.page_size == 10


def test_search_request_valid_full():
    req = SearchRequest(
        destination="Medellin",
        check_in=CHECK_IN,
        check_out=CHECK_OUT,
        adults=2,
        children=1,
        rooms=2,
        pets=True,
        price_min=100_000,
        price_max=500_000,
        amenities=["pool", "restaurant"],
        accommodation_type=["hotel", "resort"],
        stars=[4, 5],
        meal_plan="breakfast",
        page=2,
        page_size=20,
    )
    assert req.adults == 2
    assert req.pets is True
    assert req.amenities == ["pool", "restaurant"]


def test_search_request_missing_destination_raises():
    with pytest.raises(ValidationError) as exc_info:
        SearchRequest(check_in=CHECK_IN, check_out=CHECK_OUT)
    assert "destination" in str(exc_info.value)


def test_search_request_missing_check_in_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogota", check_out=CHECK_OUT)


def test_search_request_missing_check_out_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogota", check_in=CHECK_IN)


def test_search_request_checkout_before_checkin_raises():
    with pytest.raises(ValidationError) as exc_info:
        SearchRequest(
            destination="Bogota",
            check_in=CHECK_OUT,  # intentionally reversed
            check_out=CHECK_IN,
        )
    assert "check_out" in str(exc_info.value).lower() or "after" in str(exc_info.value)


def test_search_request_same_dates_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogota", check_in=CHECK_IN, check_out=CHECK_IN)


def test_search_request_adults_zero_raises():
    with pytest.raises(ValidationError):
        SearchRequest(
            destination="Bogota", check_in=CHECK_IN, check_out=CHECK_OUT, adults=0
        )


def test_search_request_children_negative_raises():
    with pytest.raises(ValidationError):
        SearchRequest(
            destination="Bogota", check_in=CHECK_IN, check_out=CHECK_OUT, children=-1
        )


def test_search_request_page_size_exceeds_limit_raises():
    with pytest.raises(ValidationError):
        SearchRequest(
            destination="Bogota", check_in=CHECK_IN, check_out=CHECK_OUT, page_size=100
        )


def test_search_request_price_min_negative_raises():
    with pytest.raises(ValidationError):
        SearchRequest(
            destination="Bogota", check_in=CHECK_IN, check_out=CHECK_OUT, price_min=-1
        )


# ---------------------------------------------------------------------------
# PropertyResult — response construction
# ---------------------------------------------------------------------------


def test_property_result_construction():
    result = PropertyResult(
        id=1,
        room_id=101,
        name="Hotel TravelHub",
        image="https://example.com/hotel.jpg",
        distance_from_center=1.5,
        stars=4,
        rating=AccommodationRating(score=4.2, review_count=200),
        amenities=[AmenityItem(id="pool"), AmenityItem(id="restaurant")],
        has_breakfast=True,
        price=AccommodationPrice(
            amount=4_760_000.0,
            currency="COP",
            nights=4,
            adults=2,
            includes_taxes=True,
        ),
    )
    assert result.price.includes_taxes is True
    assert result.price.currency == "COP"
    assert result.rating.score == 4.2
    assert result.rating.review_count == 200
    assert result.has_breakfast is True
    assert result.room_id == 101
    assert len(result.amenities) == 2
    assert result.amenities[0].id == "pool"


def test_property_result_camelcase_json():
    """PropertyResult serializes to camelCase JSON (matches frontend Accommodation interface)."""
    result = PropertyResult(
        id=1,
        room_id=101,
        name="Hotel TravelHub",
        rating=AccommodationRating(score=4.5, review_count=10),
        amenities=[AmenityItem(id="wifi")],
        has_breakfast=False,
        price=AccommodationPrice(amount=500_000.0, nights=2, adults=1),
    )
    data = result.model_dump(by_alias=True)
    assert "distanceFromCenter" in data
    assert "roomId" in data
    assert "hasBreakfast" in data
    assert "reviewCount" in data["rating"]
    assert "includesTaxes" in data["price"]


# ---------------------------------------------------------------------------
# SearchResponse — pagination
# ---------------------------------------------------------------------------


def test_search_response_empty():
    response = SearchResponse(results=[], total=0, page=1, page_size=10, total_pages=0)
    assert response.total == 0
    assert response.results == []


def test_search_response_camelcase_json():
    """SearchResponse serializes pagination fields to camelCase."""
    response = SearchResponse(
        results=[], total=100, page=2, page_size=5, total_pages=20
    )
    data = response.model_dump(by_alias=True)
    assert data["pageSize"] == 5
    assert data["totalPages"] == 20
