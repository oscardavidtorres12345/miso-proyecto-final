"""
Unit tests for src/api/v1/search.py — HTTP layer only, service mocked.
Covers: get_filters and search_properties endpoints (HU002).
"""
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from src.main import app
from src.infrastructure.database.session import get_db, get_read_db
from src.domain.schemas.search import (
    AccommodationPrice,
    AccommodationRating,
    AmenityItem,
    FilterOption,
    FiltersResponse,
    PropertyResult,
    SearchResponse,
)

# Override DB dependencies so no PostgreSQL connection is needed
app.dependency_overrides[get_read_db] = lambda: AsyncMock()
app.dependency_overrides[get_db] = lambda: AsyncMock()

client = TestClient(app)

TODAY = date.today()
CHECK_IN = TODAY + timedelta(days=5)
CHECK_OUT = TODAY + timedelta(days=9)

_CHECK_IN_STR = str(CHECK_IN)
_CHECK_OUT_STR = str(CHECK_OUT)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _filters_response() -> FiltersResponse:
    return FiltersResponse(
        accommodation_types=[FilterOption(id="hotel"), FilterOption(id="cabin")],
        services=[FilterOption(id="pool"), FilterOption(id="wifi")],
        meals=[FilterOption(id="breakfast")],
        stars=[FilterOption(id="5"), FilterOption(id="4")],
    )


def _search_response(n: int = 1) -> SearchResponse:
    results = [
        PropertyResult(
            id=i,
            room_id=100 + i,
            name=f"Hotel {i}",
            rating=AccommodationRating(score=4.0, review_count=10),
            amenities=[AmenityItem(id="pool")],
            has_breakfast=False,
            price=AccommodationPrice(amount=800_000.0, nights=4, adults=2),
        )
        for i in range(1, n + 1)
    ]
    return SearchResponse(results=results, total=n, page=1, page_size=10, total_pages=1)


# ---------------------------------------------------------------------------
# GET /api/v1/search/filters — success path
# ---------------------------------------------------------------------------

def test_get_filters_returns_200_with_valid_params():
    with patch("src.api.v1.search.SearchService") as MockSvc:
        svc = AsyncMock()
        svc.get_filters.return_value = _filters_response()
        MockSvc.return_value = svc
        resp = client.get(
            "/api/v1/search/filters",
            params={
                "destination": "Cartagena",
                "check_in": _CHECK_IN_STR,
                "check_out": _CHECK_OUT_STR,
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "accommodationTypes" in data
    assert data["accommodationTypes"][0]["id"] == "hotel"
    assert len(data["services"]) == 2


def test_get_filters_delegates_to_service():
    with patch("src.api.v1.search.SearchService") as MockSvc:
        svc = AsyncMock()
        svc.get_filters.return_value = _filters_response()
        MockSvc.return_value = svc
        client.get(
            "/api/v1/search/filters",
            params={
                "destination": "Bogota",
                "check_in": _CHECK_IN_STR,
                "check_out": _CHECK_OUT_STR,
                "adults": 3,
                "rooms": 2,
            },
        )
        svc.get_filters.assert_awaited_once()


# ---------------------------------------------------------------------------
# GET /api/v1/search/filters — validation errors
# ---------------------------------------------------------------------------

def test_get_filters_whitespace_destination_returns_422():
    resp = client.get(
        "/api/v1/search/filters",
        params={
            "destination": "   ",
            "check_in": _CHECK_IN_STR,
            "check_out": _CHECK_OUT_STR,
        },
    )
    assert resp.status_code == 422
    assert "destination" in resp.json()["detail"].lower()


def test_get_filters_checkout_equal_checkin_returns_422():
    resp = client.get(
        "/api/v1/search/filters",
        params={
            "destination": "Cartagena",
            "check_in": _CHECK_IN_STR,
            "check_out": _CHECK_IN_STR,  # same day
        },
    )
    assert resp.status_code == 422


def test_get_filters_checkout_before_checkin_returns_422():
    resp = client.get(
        "/api/v1/search/filters",
        params={
            "destination": "Cartagena",
            "check_in": _CHECK_OUT_STR,  # reversed
            "check_out": _CHECK_IN_STR,
        },
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/v1/search/filters — error handling
# ---------------------------------------------------------------------------

def test_get_filters_service_exception_returns_500():
    with patch("src.api.v1.search.SearchService") as MockSvc:
        svc = AsyncMock()
        svc.get_filters.side_effect = RuntimeError("DB connection lost")
        MockSvc.return_value = svc
        resp = client.get(
            "/api/v1/search/filters",
            params={
                "destination": "Cartagena",
                "check_in": _CHECK_IN_STR,
                "check_out": _CHECK_OUT_STR,
            },
        )
    assert resp.status_code == 500
    assert "Filter lookup failed" in resp.json()["detail"]
    assert "DB connection lost" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# GET /api/v1/search/properties — success path
# ---------------------------------------------------------------------------

def test_search_properties_returns_200():
    with patch("src.api.v1.search.SearchService") as MockSvc:
        svc = AsyncMock()
        svc.search_properties.return_value = _search_response(3)
        MockSvc.return_value = svc
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": _CHECK_IN_STR,
                "check_out": _CHECK_OUT_STR,
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["results"]) == 3


def test_search_properties_empty_results():
    with patch("src.api.v1.search.SearchService") as MockSvc:
        svc = AsyncMock()
        svc.search_properties.return_value = _search_response(0)
        MockSvc.return_value = svc
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Nonexistent",
                "check_in": _CHECK_IN_STR,
                "check_out": _CHECK_OUT_STR,
            },
        )
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
    assert resp.json()["results"] == []


def test_search_properties_with_all_optional_filters():
    with patch("src.api.v1.search.SearchService") as MockSvc:
        svc = AsyncMock()
        svc.search_properties.return_value = _search_response(1)
        MockSvc.return_value = svc
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Medellin",
                "check_in": _CHECK_IN_STR,
                "check_out": _CHECK_OUT_STR,
                "adults": 2,
                "children": 1,
                "rooms": 2,
                "pets": "true",
                "price_min": 500000,
                "price_max": 5000000,
                "amenities": ["pool", "wifi"],
                "accommodation_type": ["hotel"],
                "stars": [4, 5],
                "has_breakfast": "true",
                "meal_plan": "buffet",
                "country": "CO",
                "page": 2,
                "page_size": 20,
            },
        )
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# GET /api/v1/search/properties — validation errors
# ---------------------------------------------------------------------------

def test_search_properties_whitespace_destination_returns_422():
    resp = client.get(
        "/api/v1/search/properties",
        params={
            "destination": "   ",
            "check_in": _CHECK_IN_STR,
            "check_out": _CHECK_OUT_STR,
        },
    )
    assert resp.status_code == 422
    assert "destination" in resp.json()["detail"].lower()


def test_search_properties_checkout_equal_checkin_returns_422():
    resp = client.get(
        "/api/v1/search/properties",
        params={
            "destination": "Cartagena",
            "check_in": _CHECK_IN_STR,
            "check_out": _CHECK_IN_STR,
        },
    )
    assert resp.status_code == 422


def test_search_properties_checkout_before_checkin_returns_422():
    resp = client.get(
        "/api/v1/search/properties",
        params={
            "destination": "Cartagena",
            "check_in": _CHECK_OUT_STR,
            "check_out": _CHECK_IN_STR,
        },
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/v1/search/properties — error handling
# ---------------------------------------------------------------------------

def test_search_properties_service_exception_returns_500():
    with patch("src.api.v1.search.SearchService") as MockSvc:
        svc = AsyncMock()
        svc.search_properties.side_effect = RuntimeError("timeout")
        MockSvc.return_value = svc
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": _CHECK_IN_STR,
                "check_out": _CHECK_OUT_STR,
            },
        )
    assert resp.status_code == 500
    assert "Search failed" in resp.json()["detail"]
    assert "timeout" in resp.json()["detail"]
