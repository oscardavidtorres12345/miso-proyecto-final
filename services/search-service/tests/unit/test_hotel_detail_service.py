"""
HU004 — Visualización de detalle de hospedaje (search-service).
Ciclo TDD: estos tests deben fallar (RED) antes de que exista implementación.
"""
import pytest
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

from src.domain.schemas.search import AmenityItem, AccommodationRating
from src.domain.schemas.hotel_detail import (
    CheckInSchedule,
    CheckOutSchedule,
    HotelDetailResponse,
    HotelPhoto,
    HotelSchedule,
    RoomPrice,
    RoomResult,
    SuggestedRoom,
)
from src.domain.services.hotel_detail_service import HotelDetailService

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

TODAY = date.today()
CHECK_IN = TODAY + timedelta(days=10)
CHECK_OUT = TODAY + timedelta(days=14)  # 4 nights


def _make_room(room_id: int = 1, total: float = 800_000.0) -> RoomResult:
    return RoomResult(
        id=room_id,
        name="Suite Junior",
        description="Cama king. Capacidad máxima: 2 persona(s).",
        images=[f"https://picsum.photos/seed/room{room_id}/600/400"],
        price=RoomPrice(
            total_amount=total,
            price_per_night=200_000.0,
            currency="COP",
            nights=4,
            adults=2,
            includes_taxes=True,
        ),
    )


def _make_hotel_detail() -> HotelDetailResponse:
    return HotelDetailResponse(
        id=1,
        name="Aonang Villa Resort",
        description="",
        stars=4,
        rating=AccommodationRating(score=4.2, review_count=200),
        photos=[HotelPhoto(url="https://picsum.photos/seed/hotel1/1200/600", alt="Vista principal")],
        amenities=[AmenityItem(id="wifi"), AmenityItem(id="pool")],
        schedule=HotelSchedule(
            check_in=CheckInSchedule(),
            check_out=CheckOutSchedule(),
        ),
        rooms=[_make_room()],
        suggested_room=SuggestedRoom(
            name="Suite Junior",
            meal_plan="none",
            total_price=800_000.0,
            currency="COP",
        ),
    )


# ---------------------------------------------------------------------------
# Schema tests — reutiliza AmenityItem y AccommodationRating de search
# ---------------------------------------------------------------------------

def test_hotel_detail_response_can_be_instantiated():
    detail = _make_hotel_detail()
    assert detail.id == 1
    assert detail.name == "Aonang Villa Resort"
    assert detail.stars == 4


def test_hotel_detail_reuses_amenity_item_from_search():
    """AmenityItem debe ser el mismo tipo que usa el search-service."""
    detail = _make_hotel_detail()
    assert all(isinstance(a, AmenityItem) for a in detail.amenities)


def test_hotel_detail_reuses_accommodation_rating_from_search():
    """AccommodationRating debe ser el mismo tipo que usa el search-service."""
    detail = _make_hotel_detail()
    assert isinstance(detail.rating, AccommodationRating)
    assert detail.rating.review_count == 200


def test_hotel_detail_serializes_to_camel_case():
    """La serialización JSON debe usar camelCase para el frontend."""
    data = _make_hotel_detail().model_dump(by_alias=True)
    assert "reviewCount" in data["rating"]
    assert "totalAmount" in data["rooms"][0]["price"]
    assert "pricePerNight" in data["rooms"][0]["price"]
    assert "includesTaxes" in data["rooms"][0]["price"]
    assert "checkIn" in data["schedule"]
    assert "checkOut" in data["schedule"]
    assert "suggestedRoom" in data
    assert "mealPlan" in data["suggestedRoom"]
    assert "totalPrice" in data["suggestedRoom"]


def test_check_in_schedule_defaults():
    schedule = CheckInSchedule()
    assert schedule.from_time == "15:00"
    assert schedule.to == "23:59"


def test_check_out_schedule_defaults():
    assert CheckOutSchedule().time == "13:00"


def test_check_in_from_field_alias():
    """'from_time' debe serializarse como 'from' (keyword reservado en Python)."""
    data = CheckInSchedule().model_dump(by_alias=True)
    assert "from" in data
    assert data["from"] == "15:00"


def test_room_result_price_breakdown():
    room = _make_room(total=800_000.0)
    assert room.price.total_amount == 800_000.0
    assert room.price.price_per_night == 200_000.0
    assert room.price.nights == 4
    assert room.price.includes_taxes is True


def test_suggested_room_can_be_none():
    detail = _make_hotel_detail()
    detail.suggested_room = None
    assert detail.model_dump(by_alias=True)["suggestedRoom"] is None


# ---------------------------------------------------------------------------
# Service tests — repositorio mockeado
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_service_delegates_to_repository():
    """HotelDetailService.get_detail debe llamar a HotelRepository.get_by_id."""
    mock_session = AsyncMock()
    expected = _make_hotel_detail()

    with patch("src.domain.services.hotel_detail_service.HotelRepository") as MockRepo:
        mock_repo = AsyncMock()
        mock_repo.get_by_id.return_value = expected
        MockRepo.return_value = mock_repo

        result = await HotelDetailService(mock_session).get_detail(1, CHECK_IN, CHECK_OUT, adults=2)

    mock_repo.get_by_id.assert_awaited_once_with(1, CHECK_IN, CHECK_OUT, 2)
    assert result is expected


@pytest.mark.asyncio
async def test_service_returns_none_when_hotel_not_found():
    """get_detail debe retornar None cuando el hotel no existe en DB."""
    mock_session = AsyncMock()

    with patch("src.domain.services.hotel_detail_service.HotelRepository") as MockRepo:
        mock_repo = AsyncMock()
        mock_repo.get_by_id.return_value = None
        MockRepo.return_value = mock_repo

        result = await HotelDetailService(mock_session).get_detail(999, CHECK_IN, CHECK_OUT)

    assert result is None


@pytest.mark.asyncio
async def test_service_returns_hotel_detail_response_on_success():
    """get_detail debe retornar HotelDetailResponse válido al encontrar el hotel."""
    mock_session = AsyncMock()
    expected = _make_hotel_detail()

    with patch("src.domain.services.hotel_detail_service.HotelRepository") as MockRepo:
        mock_repo = AsyncMock()
        mock_repo.get_by_id.return_value = expected
        MockRepo.return_value = mock_repo

        result = await HotelDetailService(mock_session).get_detail(1, CHECK_IN, CHECK_OUT)

    assert isinstance(result, HotelDetailResponse)
    assert result.id == 1
    assert len(result.rooms) == 1
    assert result.rating.score == 4.2
