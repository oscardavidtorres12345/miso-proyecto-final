"""
Integration tests for GET /api/v1/search/properties and GET /api/v1/search/filters (HU002).
Uses FastAPI TestClient with mocked lifespan and SearchService — no real DB required.
"""

import pytest
from contextlib import asynccontextmanager
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from main import app
from src.domain.schemas.search import (
    AccommodationPrice,
    AccommodationRating,
    AmenityItem,
    PropertyResult,
    SearchResponse,
)
from src.infrastructure.database.session import get_db, get_read_db

TODAY = date.today()
CHECK_IN = (TODAY + timedelta(days=10)).isoformat()
CHECK_OUT = (TODAY + timedelta(days=14)).isoformat()
NIGHTS = 4


def _mock_response(n: int = 2) -> SearchResponse:
    results = [
        PropertyResult(
            id=i,
            room_id=1000 + i,
            name=f"Hotel Cartagena {i}",
            image="https://example.com/img.jpg",
            distance_from_center=1.2 * i,
            stars=4,
            rating=AccommodationRating(score=4.2, review_count=200),
            amenities=[AmenityItem(id="pool"), AmenityItem(id="restaurant")],
            has_breakfast=True,
            price=AccommodationPrice(
                amount=4_760_000.0,
                currency="COP",
                nights=NIGHTS,
                adults=2,
                includes_taxes=True,
            ),
        )
        for i in range(1, n + 1)
    ]
    return SearchResponse(results=results, total=n, page=1, page_size=10, total_pages=1)


async def override_get_db():
    yield AsyncMock()


# Override both primary and read-replica sessions (PF-281)
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_read_db] = override_get_db


@asynccontextmanager
async def _mock_lifespan(application):
    """Lifespan without DB or Redis connection — for tests only."""
    yield


@pytest.fixture
def client():
    """TestClient with mocked lifespan to avoid connecting to PostgreSQL."""
    with patch("main.lifespan", _mock_lifespan):
        app.router.lifespan_context = _mock_lifespan
        with TestClient(app) as c:
            yield c
        app.router.lifespan_context = None


# ---------------------------------------------------------------------------
# CA: Search results — valid parameters
# ---------------------------------------------------------------------------


def test_search_returns_200_with_valid_params(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(2),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "adults": 2,
            },
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert len(body["results"]) == 2

    # CA: Response uses camelCase keys matching the frontend Accommodation interface
    result = body["results"][0]
    assert "price" in result
    assert result["roomId"] > 0
    assert result["price"]["includesTaxes"] is True  # taxes flag for the frontend
    assert result["price"]["amount"] > 0  # total with taxes
    assert result["price"]["nights"] == NIGHTS  # frontend: "X nights"
    assert result["price"]["adults"] == 2  # frontend: "X adults"
    assert result["price"]["currency"] == "COP"
    assert "rating" in result
    assert result["rating"]["score"] == 4.2
    assert result["rating"]["reviewCount"] == 200
    assert result["hasBreakfast"] is True
    assert result["amenities"] == [{"id": "pool"}, {"id": "restaurant"}]


# ---------------------------------------------------------------------------
# CA: Required field validation
# ---------------------------------------------------------------------------


def test_search_missing_destination_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={"check_in": CHECK_IN, "check_out": CHECK_OUT},
    )
    assert resp.status_code == 422


def test_search_missing_check_in_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={"destination": "Bogota", "check_out": CHECK_OUT},
    )
    assert resp.status_code == 422


def test_search_missing_check_out_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={"destination": "Bogota", "check_in": CHECK_IN},
    )
    assert resp.status_code == 422


def test_search_checkout_before_checkin_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={
            "destination": "Bogota",
            "check_in": CHECK_OUT,  # intentionally reversed
            "check_out": CHECK_IN,
        },
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# CA: Optional filters — passed through correctly
# ---------------------------------------------------------------------------


def test_search_with_pets_filter(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(1),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "pets": True,
            },
        )
    assert resp.status_code == 200


def test_search_with_stars_filter(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(1),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "stars": [4, 5],
            },
        )
    assert resp.status_code == 200


def test_search_with_price_range(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(0),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "price_min": 500_000,
                "price_max": 2_000_000,
            },
        )
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


# ---------------------------------------------------------------------------
# CA: Pagination — camelCase response keys
# ---------------------------------------------------------------------------


def test_search_pagination_params(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=SearchResponse(
            results=[], total=100, page=2, page_size=5, total_pages=20
        ),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Medellin",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "page": 2,
                "page_size": 5,
            },
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["page"] == 2
    assert body["pageSize"] == 5
    assert body["totalPages"] == 20


def test_search_with_country_filter(client):
    """HU023 PF-284: country param activates partition pruning on the correct shard."""
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(2),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "adults": 2,
                "country": "CO",  # activates partition pruning → scans only property_co
            },
        )
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


# ---------------------------------------------------------------------------
# CA: GET /filters — static filter catalogue
# ---------------------------------------------------------------------------


def test_get_filters_returns_200(client):
    """GET /filters returns all filter option slugs for the search UI."""
    resp = client.get("/api/v1/search/filters")
    assert resp.status_code == 200
    body = resp.json()

    # Verify all four option groups are present (camelCase keys)
    assert "accommodationTypes" in body
    assert "services" in body
    assert "meals" in body
    assert "stars" in body

    # Verify expected slug IDs for accommodation types
    acc_ids = [o["id"] for o in body["accommodationTypes"]]
    assert set(acc_ids) == {"hotel", "house", "cabin", "hostel", "villa", "resort"}

    # Verify expected meal slugs
    meal_ids = [o["id"] for o in body["meals"]]
    assert set(meal_ids) == {"breakfast", "buffet", "allinclusive"}

    # Verify stars range
    star_ids = [o["id"] for o in body["stars"]]
    assert set(star_ids) == {"1", "2", "3", "4", "5"}


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
