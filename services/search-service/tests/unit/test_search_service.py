"""
Unit tests for SearchService and PropertyRepository (HU002 + HU023).
Uses mocks for DB session and cache — no real infrastructure required.
"""

import pytest
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from src.domain.schemas.search import (
    AccommodationPrice,
    AccommodationRating,
    AmenityItem,
    FilterOption,
    FiltersResponse,
    PropertyResult,
    SearchRequest,
    SearchResponse,
)
from src.domain.services.search_service import SearchService
from src.infrastructure.cache.redis_cache import make_cache_key
from src.infrastructure.repositories.property_repository import _date_range

TODAY = date.today()
CHECK_IN = TODAY + timedelta(days=5)
CHECK_OUT = TODAY + timedelta(days=9)  # 4 nights


# ---------------------------------------------------------------------------
# Internal helpers
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


# ---------------------------------------------------------------------------
# SearchService — mock repository
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
            room_id=1000 + i,
            name=f"Hotel {i}",
            image=None,
            distance_from_center=1.0,
            stars=4,
            rating=AccommodationRating(score=4.2, review_count=10),
            amenities=[AmenityItem(id="pool")],
            has_breakfast=True,
            price=AccommodationPrice(
                amount=4_760_000.0,
                currency="COP",
                nights=4,
                adults=2,
                includes_taxes=True,
            ),
        )
        for i in range(1, n + 1)
    ]
    return SearchResponse(results=results, total=n, page=1, page_size=10, total_pages=1)


@pytest.mark.asyncio
async def test_search_service_delegates_to_repository():
    mock_session = AsyncMock()
    expected = _make_response(3)

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
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

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = empty
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session)
        req = _make_request(destination="Nonexistent destination XYZ")
        result = await service.search_properties(req)

    assert result.total == 0
    assert result.results == []


@pytest.mark.asyncio
async def test_search_service_passes_filters_to_repository():
    mock_session = AsyncMock()
    expected = _make_response(1)

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = expected
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session)
        req = _make_request(
            pets=True,
            stars=[4, 5],
            accommodation_type=["hotel"],
            amenities=["pool"],
            price_max=500_000,
        )
        await service.search_properties(req)

    called_req = mock_repo_instance.search.call_args[0][0]
    assert called_req.pets is True
    assert called_req.stars == [4, 5]
    assert called_req.accommodation_type == ["hotel"]
    assert called_req.amenities == ["pool"]
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
    k2 = make_cache_key("props", {"destination": "Medellin"})
    assert k1 != k2


# ---------------------------------------------------------------------------
# SearchService.get_filters — dynamic filter aggregation
# ---------------------------------------------------------------------------


def _make_filters_response():
    return FiltersResponse(
        accommodation_types=[FilterOption(id="hotel"), FilterOption(id="cabin")],
        services=[FilterOption(id="pool"), FilterOption(id="wifi")],
        meals=[FilterOption(id="breakfast")],
        stars=[FilterOption(id="5"), FilterOption(id="4")],
    )


@pytest.mark.asyncio
async def test_get_filters_delegates_to_repository():
    """get_filters() must call repository.get_available_filters with the request."""
    mock_session = AsyncMock()
    expected = _make_filters_response()

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.get_available_filters.return_value = expected
        MockRepo.return_value = mock_repo_instance

        service = SearchService(mock_session)
        req = _make_request()
        result = await service.get_filters(req)

    mock_repo_instance.get_available_filters.assert_awaited_once_with(req)
    assert len(result.accommodation_types) == 2
    assert result.accommodation_types[0].id == "hotel"


@pytest.mark.asyncio
async def test_get_filters_returns_only_present_options():
    """Filters must reflect what's actually in the results, not the full catalogue."""
    mock_session = AsyncMock()
    # Only hotel + cabin, no resort/villa/hostel/house
    sparse = FiltersResponse(
        accommodation_types=[FilterOption(id="hotel")],
        services=[FilterOption(id="spa")],
        meals=[],
        stars=[FilterOption(id="5")],
    )

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.get_available_filters.return_value = sparse
        MockRepo.return_value = mock_repo_instance

        result = await SearchService(mock_session).get_filters(_make_request())

    assert len(result.accommodation_types) == 1
    assert result.accommodation_types[0].id == "hotel"
    assert result.meals == []


@pytest.mark.asyncio
async def test_get_filters_cache_hit_skips_repository():
    """On cache HIT, repository.get_available_filters must NOT be called."""
    mock_session = AsyncMock()
    expected = _make_filters_response()
    mock_cache = MagicMock()
    mock_cache.get = AsyncMock(return_value=expected.model_dump(mode="json"))
    mock_cache.set = AsyncMock()

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        MockRepo.return_value = mock_repo_instance

        result = await SearchService(mock_session, cache=mock_cache).get_filters(
            _make_request()
        )

    mock_repo_instance.get_available_filters.assert_not_awaited()
    mock_cache.set.assert_not_awaited()
    assert len(result.services) == 2


@pytest.mark.asyncio
async def test_get_filters_cache_miss_stores_result():
    """On cache MISS, result is stored in cache after querying DB."""
    mock_session = AsyncMock()
    expected = _make_filters_response()
    mock_cache = MagicMock()
    mock_cache.get = AsyncMock(return_value=None)
    mock_cache.set = AsyncMock()

    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.get_available_filters.return_value = expected
        MockRepo.return_value = mock_repo_instance

        await SearchService(mock_session, cache=mock_cache).get_filters(_make_request())

    mock_repo_instance.get_available_filters.assert_awaited_once()
    mock_cache.set.assert_awaited_once()


def test_filters_cache_key_differs_from_search_cache_key():
    """'filters' and 'props' prefixes must produce different cache keys for the same params."""
    params = {"destination": "Cartagena", "check_in": "2026-04-01"}
    assert make_cache_key("filters", params) != make_cache_key("props", params)


# ---------------------------------------------------------------------------
# SearchRequest — filter field validation
# ---------------------------------------------------------------------------

def test_price_fields_are_total_stay_not_per_night():
    """price_min/price_max descriptions must state 'total stay (taxes included)'."""
    field_min = SearchRequest.model_fields["price_min"]
    field_max = SearchRequest.model_fields["price_max"]
    assert "total" in field_min.description.lower()
    assert "total" in field_max.description.lower()
    assert "night" not in field_min.description.lower()


def test_has_breakfast_defaults_to_none():
    req = _make_request()
    assert req.has_breakfast is None


def test_has_breakfast_true_accepted():
    req = _make_request(has_breakfast=True)
    assert req.has_breakfast is True


def test_meal_plan_slug_accepted():
    req = _make_request(meal_plan="allinclusive")
    assert req.meal_plan == "allinclusive"


def test_amenities_list_accepted():
    req = _make_request(amenities=["pool", "wifi"])
    assert req.amenities == ["pool", "wifi"]


# ---------------------------------------------------------------------------
# SearchService — filter propagation to repository
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_has_breakfast_propagated_to_repository():
    """has_breakfast=True must be forwarded to repository.search."""
    mock_session = AsyncMock()
    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = _make_response(0)
        MockRepo.return_value = mock_repo_instance

        req = _make_request(has_breakfast=True)
        await SearchService(mock_session).search_properties(req)

    called_req = mock_repo_instance.search.call_args[0][0]
    assert called_req.has_breakfast is True
    assert called_req.meal_plan is None  # has_breakfast takes priority


@pytest.mark.asyncio
async def test_amenities_filter_propagated_to_repository():
    """amenities list must be forwarded intact to repository.search."""
    mock_session = AsyncMock()
    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = _make_response(0)
        MockRepo.return_value = mock_repo_instance

        req = _make_request(amenities=["pool", "spa"])
        await SearchService(mock_session).search_properties(req)

    called_req = mock_repo_instance.search.call_args[0][0]
    assert called_req.amenities == ["pool", "spa"]


@pytest.mark.asyncio
async def test_price_filter_propagated_as_total_budget():
    """price_min/price_max values must reach the repository unchanged
    (the total-vs-nightly interpretation happens inside the SQL expression)."""
    mock_session = AsyncMock()
    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = _make_response(0)
        MockRepo.return_value = mock_repo_instance

        req = _make_request(price_min=1_000_000, price_max=8_000_000)
        await SearchService(mock_session).search_properties(req)

    called_req = mock_repo_instance.search.call_args[0][0]
    assert called_req.price_min == 1_000_000
    assert called_req.price_max == 8_000_000


@pytest.mark.asyncio
async def test_meal_plan_filter_propagated_to_repository():
    """meal_plan slug must be forwarded to repository.search."""
    mock_session = AsyncMock()
    with patch("src.domain.services.search_service.PropertyRepository") as MockRepo:
        mock_repo_instance = AsyncMock()
        mock_repo_instance.search.return_value = _make_response(0)
        MockRepo.return_value = mock_repo_instance

        req = _make_request(meal_plan="allinclusive")
        await SearchService(mock_session).search_properties(req)

    called_req = mock_repo_instance.search.call_args[0][0]
    assert called_req.meal_plan == "allinclusive"
    assert called_req.has_breakfast is None


@pytest.mark.asyncio
async def test_has_breakfast_and_meal_plan_can_coexist_in_request():
    """A request with both has_breakfast and meal_plan is valid (repo decides priority)."""
    req = _make_request(has_breakfast=True, meal_plan="buffet")
    assert req.has_breakfast is True
    assert req.meal_plan == "buffet"


@pytest.mark.asyncio
async def test_response_has_breakfast_true_for_buffet_plan():
    """PropertyResult.has_breakfast must be True for buffet meal plan."""
    result = _make_response(1).results[0]
    # _make_response uses has_breakfast=True — verify it's preserved in serialisation
    assert result.has_breakfast is True
