"""
Unit tests for helper functions in src/infrastructure/repositories/hotel_repository.py.
Tests _room_description and _suggested_room without touching the database.
"""
from unittest.mock import MagicMock

from src.infrastructure.repositories.hotel_repository import (
    _room_description,
    _suggested_room,
)
from src.domain.schemas.hotel_detail import RoomPrice, RoomResult


# ---------------------------------------------------------------------------
# _room_description
# ---------------------------------------------------------------------------

def _mock_room(description=None, bed_type=None, max_capacity=None):
    room = MagicMock()
    room.description = description
    room.bed_type = bed_type
    room.max_capacity = max_capacity
    return room


def test_room_description_returns_existing_description():
    room = _mock_room(description="Habitación con vista al mar.", bed_type="king", max_capacity=2)
    assert _room_description(room) == "Habitación con vista al mar."


def test_room_description_builds_from_bed_type_and_capacity():
    room = _mock_room(description=None, bed_type="king", max_capacity=3)
    result = _room_description(room)
    assert "king" in result
    assert "3" in result


def test_room_description_builds_from_bed_type_only():
    room = _mock_room(description=None, bed_type="twin", max_capacity=None)
    result = _room_description(room)
    assert "twin" in result


def test_room_description_builds_from_capacity_only():
    room = _mock_room(description=None, bed_type=None, max_capacity=4)
    result = _room_description(room)
    assert "4" in result


def test_room_description_returns_default_when_no_info():
    room = _mock_room(description=None, bed_type=None, max_capacity=None)
    assert _room_description(room) == "Habitación estándar."


def test_room_description_empty_string_description_builds_from_fields():
    """Empty string description is falsy — should fall back to building from fields."""
    room = _mock_room(description="", bed_type="double", max_capacity=2)
    result = _room_description(room)
    assert "double" in result


# ---------------------------------------------------------------------------
# _suggested_room
# ---------------------------------------------------------------------------

def _make_room_result(room_id: int, total: float) -> RoomResult:
    return RoomResult(
        id=room_id,
        name=f"Room {room_id}",
        description="Standard room",
        images=[f"https://example.com/room{room_id}.jpg"],
        price=RoomPrice(
            total_amount=total,
            price_per_night=total / 4,
            currency="COP",
            nights=4,
            adults=2,
            includes_taxes=True,
        ),
    )


def test_suggested_room_returns_none_for_empty_list():
    result = _suggested_room([], "none")
    assert result is None


def test_suggested_room_returns_single_room():
    rooms = [_make_room_result(1, 800_000.0)]
    result = _suggested_room(rooms, "breakfast")
    assert result is not None
    assert result.name == "Room 1"
    assert result.total_price == 800_000.0
    assert result.meal_plan == "breakfast"
    assert result.currency == "COP"


def test_suggested_room_picks_cheapest():
    rooms = [
        _make_room_result(1, 1_200_000.0),
        _make_room_result(2, 800_000.0),
        _make_room_result(3, 950_000.0),
    ]
    result = _suggested_room(rooms, "none")
    assert result is not None
    assert result.name == "Room 2"
    assert result.total_price == 800_000.0


def test_suggested_room_propagates_meal_plan():
    rooms = [_make_room_result(1, 600_000.0)]
    result = _suggested_room(rooms, "allinclusive")
    assert result.meal_plan == "allinclusive"


def test_suggested_room_with_same_price_picks_first_min():
    """When prices are equal, min() returns the first one encountered."""
    rooms = [
        _make_room_result(1, 500_000.0),
        _make_room_result(2, 500_000.0),
    ]
    result = _suggested_room(rooms, "none")
    assert result is not None
    assert result.total_price == 500_000.0
