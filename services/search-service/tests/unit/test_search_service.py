"""
Pruebas unitarias para SearchService y PropertyRepository (HU002 + HU023).
Usa mocks de la sesión de BD y del cache — sin infraestructura real.
"""
import pytest
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from src.domain.schemas.search import SearchRequest, SearchResponse, PropertyResult
from src.domain.services.search_service import SearchService
from src.infrastructure.cache.redis_cache import make_cache_key
from src.infrastructure.repositories.property_repository import (
    _rating_label,
    _date_range,
)

TODAY = date.today()
CHECK_IN = TODAY + timedelta(days=5)
CHECK_OUT = TODAY + timedelta(days=9)  # 4 noches


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def test_date_range_4_nights():
    dates = _date_range(CHECK_IN, CHECK_OUT)
    assert len(dates) == 4
    assert dates[0] == CHECK_IN
    assert dates[-1] == CHECK_OUT - timedelta(days=1)


def test_date_range_1_night():
    d = date(2026, 6, 1)
    dates = _date_range(d, date(2026, 6, 2))
    assert dates == [d]


def test_rating_label_excelente():
    assert _rating_label(4.7) == "Excelente"


def test_rating_label_muy_bien():
    assert _rating_label(4.2) == "Muy bien"


def test_rating_label_bien():
    assert _rating_label(3.5) == "Bien"


def test_rating_label_regular():
    assert _rating_label(2.9) == "Regular"


def test_rating_label_none():
    assert _rating_label(None) is None


# ---------------------------------------------------------------------------
# SearchService — mock del repositorio
# ---------------------------------------------------------------------------

def _make_request(**overrides):
    params = dict(
        destination="Cartagena",
        check_in=CHECK_IN,
        check_out=CHECK_OUT,
        adults=2,
        children=0,
        rooms=1,
        pets=False,
    )
    params.update(overrides)
    return SearchRequest(**params)


def _make_response(n=1):
    results = [
        PropertyResult(
            id=i,
            name=f"Hotel {i}",
            location="Cartagena, Colombia",
            distance_to_center_km=1.0,
            accommodation_type="Hotel",
            stars=4,
            amenities=["Piscina"],
            meal_plan="Ninguno",
            pets_allowed=False,
            image_url=None,
            total_price=4_760_000.0,
            price_per_night=1_000_000.0,
            currency="COP",
            nights=4,
            adults=2,
            rating=4.2,
            review_count=10,
            rating_label="Muy bien",
        )
        for i in range(1, n + 1)
    ]
    return SearchResponse(results=results, total=n, page=1, page_size=10, total_pages=1)


@pytest.mark.asyncio
async def test_search_service_delegates_to_repository():
    mock_session = AsyncMock()
    expected = _make_response(3)

    with patch(
        "src.domain.services.search_service.PropertyRepository"
    ) as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = expected
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session)
        req = _make_request()
        result = await service.search_properties(req)

    mock_repo_instance.search.assert_awaited_once_with(req)
    assert result.total == 3
    assert len(result.results) == 3


@pytest.mark.asyncio
async def test_search_service_returns_empty_when_no_results():
    mock_session = AsyncMock()
    empty = _make_response(0)
    empty.results = []
    empty.total = 0

    with patch(
        "src.domain.services.search_service.PropertyRepository"
    ) as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = empty
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session)
        req = _make_request(destination="Destino inexistente XYZ")
        result = await service.search_properties(req)

    assert result.total == 0
    assert result.results == []


@pytest.mark.asyncio
async def test_search_service_passes_filters_to_repository():
    mock_session = AsyncMock()
    expected = _make_response(1)

    with patch(
        "src.domain.services.search_service.PropertyRepository"
    ) as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = expected
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session)
        req = _make_request(
            pets=True,
            stars=[4, 5],
            accommodation_type=["Hotel"],
            amenities=["Piscina"],
            price_max=500_000,
        )
        await service.search_properties(req)

    called_req = mock_repo_instance.search.call_args[0][0]
    assert called_req.pets is True
    assert called_req.stars == [4, 5]
    assert called_req.accommodation_type == ["Hotel"]
    assert called_req.amenities == ["Piscina"]
    assert called_req.price_max == 500_000


# ---------------------------------------------------------------------------
# HU023 — Cache-Aside: RedisCache & SearchService integration
# ---------------------------------------------------------------------------

def _make_mock_cache(hit: bool = False, response: SearchResponse = None):
    """Create a mock RedisCache that simulates a HIT or MISS."""
    cache = MagicMock()
    if hit and response:
        cache.get = AsyncMock(return_value=response.model_dump(mode="json"))
    else:
        cache.get = AsyncMock(return_value=None)
    cache.set = AsyncMock()
    return cache


@pytest.mark.asyncio
async def test_cache_hit_skips_repository():
    """On cache HIT, repository.search must NOT be called."""
    mock_session = AsyncMock()
    expected = _make_response(2)
    mock_cache = _make_mock_cache(hit=True, response=expected)

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session, cache=mock_cache)
        req = _make_request()
        result = await service.search_properties(req)

    mock_repo_instance.search.assert_not_awaited()
    mock_cache.set.assert_not_awaited()
    assert result.total == expected.total


@pytest.mark.asyncio
async def test_cache_miss_calls_repository_and_sets_cache():
    """On cache MISS, repository.search is called and result is stored in cache."""
    mock_session = AsyncMock()
    expected = _make_response(3)
    mock_cache = _make_mock_cache(hit=False)

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = expected
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session, cache=mock_cache)
        req = _make_request()
        result = await service.search_properties(req)

    mock_repo_instance.search.assert_awaited_once_with(req)
    mock_cache.set.assert_awaited_once()
    assert result.total == 3


@pytest.mark.asyncio
async def test_cache_miss_uses_same_key_for_get_and_set():
    """Cache key used for GET must be the same key used for SET."""
    mock_session = AsyncMock()
    expected = _make_response(1)
    mock_cache = _make_mock_cache(hit=False)

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = expected
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session, cache=mock_cache)
        req = _make_request()
        await service.search_properties(req)

    get_key = mock_cache.get.call_args[0][0]
    set_key = mock_cache.set.call_args[0][0]
    assert get_key == set_key
    assert get_key.startswith("travelhub:search:")


def test_make_cache_key_is_deterministic():
    """Same params always produce the same cache key."""
    params = {"destination": "Cartagena", "check_in": "2026-04-01", "adults": 2}
    assert make_cache_key("props", params) == make_cache_key("props", params)


def test_make_cache_key_differs_for_different_params():
    """Different params produce different cache keys."""
    k1 = make_cache_key("props", {"destination": "Cartagena"})
    k2 = make_cache_key("props", {"destination": "Medellín"})
    assert k1 != k2

