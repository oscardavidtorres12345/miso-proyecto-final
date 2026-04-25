from __future__ import annotations

from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from src.api.v1.internal_sync import (
    InventorySyncRequest,
    InventorySyncEntry,
    RateSyncEntry,
    RateSyncRequest,
    sync_inventory_room,
    sync_room_rates,
)
from src.domain.schemas.search import SearchRequest
from src.infrastructure.repositories.property_repository import PropertyRepository
from src.infrastructure.repositories.hotel_repository import HotelRepository


class _ExecResult:
    def __init__(
        self, *, rows=None, one=None, first=None, scalars_first=None, scalars_all=None
    ):
        self._rows = rows or []
        self._one = one
        self._first = first
        self._scalars_first = scalars_first
        self._scalars_all = scalars_all

    def all(self):
        return self._rows

    def one(self):
        return self._one

    def first(self):
        return self._first

    def scalars(self):
        return self


class _SearchRow:
    def __init__(self, values, total_count: int):
        self._values = values
        self.total_count = total_count

    def __iter__(self):
        return iter(self._values)


def _make_search_req(**kwargs) -> SearchRequest:
    today = date.today()
    params = {
        "destination": "Cartagena",
        "check_in": today + timedelta(days=5),
        "check_out": today + timedelta(days=8),
        "adults": 2,
        "children": 1,
        "rooms": 1,
        "pets": True,
        "accommodation_type": ["hotel"],
        "stars": [4, 5],
        "has_breakfast": True,
        "amenities": ["wifi", "pool"],
        "price_min": 1,
        "price_max": 9999999,
        "country": "co",
    }
    params.update(kwargs)
    return SearchRequest(**params)


@pytest.mark.asyncio
async def test_property_repository_search_and_filters() -> None:
    prop = SimpleNamespace(
        id=1,
        name="TH Cartagena",
        image_url="https://img",
        distance_to_center_km=1.2,
        stars=5,
        amenities=["wifi", "pool"],
        tax_rate=0.19,
        meal_plan=SimpleNamespace(value="breakfast"),
    )

    search_rows = [_SearchRow((prop, 11, 100.0, "COP", 4.8, 10, 1), total_count=1)]
    filter_rows = [
        (
            SimpleNamespace(value="hotel"),
            5,
            SimpleNamespace(value="breakfast"),
            ["wifi", "pool"],
        ),
    ]

    session = SimpleNamespace()
    _queue = [_ExecResult(rows=search_rows), _ExecResult(rows=filter_rows)]
    session.execute = AsyncMock(side_effect=lambda *_args, **_kwargs: _queue.pop(0))

    repo = PropertyRepository(session)
    result = await repo.search(_make_search_req())
    assert result.total == 1
    assert result.results[0].id == 1
    assert result.results[0].has_breakfast is True

    filters = await repo.get_available_filters(_make_search_req())
    assert filters.accommodation_types[0].id == "hotel"
    assert filters.meals[0].id == "breakfast"


@pytest.mark.asyncio
async def test_hotel_repository_happy_path_and_booking_detail() -> None:
    prop = SimpleNamespace(
        id=10,
        name="TH Hotel",
        location="Cartagena, Colombia",
        description="",
        stars=4,
        amenities=["wifi"],
        image_url="https://img",
        tax_rate=0.19,
        meal_plan=SimpleNamespace(value="breakfast"),
        country="CO",
    )
    room = SimpleNamespace(
        id=101,
        property_id=10,
        name="Suite",
        description=None,
        bed_type="king",
        max_capacity=3,
        image_url=None,
    )

    today = date.today()
    check_in = today + timedelta(days=3)
    check_out = today + timedelta(days=6)

    session = SimpleNamespace()
    _queue = [
        _ExecResult(scalars_first=prop),
        _ExecResult(one=SimpleNamespace(avg_rating=4.5, review_count=20)),
        _ExecResult(scalars_all=[room]),
        _ExecResult(one=SimpleNamespace(avg_amount=200.0, currency="COP")),
        _ExecResult(first=(room, prop)),
    ]
    for result in _queue:
        result.scalars = lambda r=result: SimpleNamespace(
            first=lambda: r._scalars_first, all=lambda: r._scalars_all
        )
    session.execute = AsyncMock(side_effect=lambda *_args, **_kwargs: _queue.pop(0))

    repo = HotelRepository(session)
    detail = await repo.get_by_id(10, check_in, check_out, adults=2)
    assert detail is not None
    assert detail.id == 10
    assert len(detail.rooms) == 1

    booking = await repo.get_booking_detail_by_room_id(room_id=101, units=1)
    assert booking is not None
    assert booking.hotel_name == "TH Hotel"
    assert booking.country == "Colombia"


@pytest.mark.asyncio
async def test_internal_sync_endpoints() -> None:
    db = SimpleNamespace()
    db.execute = AsyncMock(return_value=_ExecResult(scalars_first=None))
    db.add = lambda *_: None
    db.commit = AsyncMock(return_value=None)

    inv_req = InventorySyncRequest(
        entries=[
            InventorySyncEntry(date=date.today(), total_units=3, confirmed_units=1)
        ]
    )
    rate_req = RateSyncRequest(
        currency="cop", entries=[RateSyncEntry(date=date.today(), amount=100)]
    )

    from src.api.v1 import internal_sync as mod

    mod.redis_cache.delete_by_prefix = AsyncMock()

    inv_res = await sync_inventory_room(1, inv_req, db)
    assert inv_res.upserted == 1

    rate_res = await sync_room_rates(1, rate_req, db)
    assert rate_res.upserted == 1

    with pytest.raises(HTTPException):
        await sync_inventory_room(0, inv_req, db)
    with pytest.raises(HTTPException):
        await sync_room_rates(0, rate_req, db)
