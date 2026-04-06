"""
HU004 — Visualización de detalle de hospedaje
Ciclo TDD: estos tests deben fallar (RED) antes de que exista implementación.
"""
import pytest
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

from src.domain.schemas.hotel_detail import (
    AmenityItem,
    CheckInSchedule,
    CheckOutSchedule,
    HotelDetailResponse,
    HotelPhoto,
    HotelRating,
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
        rating=HotelRating(score=4.2, review_count=200),
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
# Schema tests
# ---------------------------------------------------------------------------

def test_hotel_detail_response_can_be_instantiated():
    """HotelDetailResponse debe poder crearse con todos sus campos."""
    detail = _make_hotel_detail()
    assert detail.id == 1
    assert detail.name == "Aonang Villa Resort"
    assert detail.stars == 4


def test_hotel_detail_response_serializes_to_camel_case():
    """La serialización JSON debe usar camelCase para el frontend."""
    detail = _make_hotel_detail()
    data = detail.model_dump(by_alias=True)
    assert "reviewCount" in data["rating"]
    assert "totalAmount" in data["rooms"][0]["price"]
    assert "pricePerNight" in data["rooms"][0]["price"]
    assert "includesTaxes" in data["rooms"][0]["price"]
    assert "checkIn" in data["schedule"]
    assert "checkOut" in data["schedule"]
    assert "suggestedRoom" in data
    assert "mealPlan" in data["suggestedRoom"]
    assert "totalPrice" in data["suggestedRoom"]


def test_check_in_schedule_default_values():
    """El horario de check-in por defecto debe ser 15:00 – 23:59."""
    schedule = CheckInSchedule()
    assert schedule.from_time == "15:00"
    assert schedule.to == "23:59"


def test_check_out_schedule_default_values():
    """El horario de check-out por defecto debe ser 13:00."""
    schedule = CheckOutSchedule()
    assert schedule.time == "13:00"


def test_check_in_schedule_from_field_alias():
    """El campo from_ debe serializarse como 'from' en el JSON."""
    schedule = CheckInSchedule()
    data = schedule.model_dump(by_alias=True)
    assert "from" in data
    assert data["from"] == "15:00"
    assert data["to"] == "23:59"


def test_room_result_price_breakdown():
    """RoomResult debe incluir desglose completo de precio."""
    room = _make_room(total=800_000.0)
    assert room.price.total_amount == 800_000.0
    assert room.price.price_per_night == 200_000.0
    assert room.price.nights == 4
    assert room.price.currency == "COP"
    assert room.price.includes_taxes is True


def test_hotel_detail_optional_suggested_room():
    """suggested_room puede ser None (sin habitación sugerida)."""
    detail = _make_hotel_detail()
    detail.suggested_room = None
    data = detail.model_dump(by_alias=True)
    assert data["suggestedRoom"] is None


# ---------------------------------------------------------------------------
# Service tests — repositorio mockeado
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_service_delegates_to_repository():
    """HotelDetailService.get_detail debe llamar a repository.get_by_id."""
    mock_session = AsyncMock()
    expected = _make_hotel_detail()

    with patch(
        "src.domain.services.hotel_detail_service.HotelRepository"
    ) as MockRepo:
        mock_repo = AsyncMock()
        mock_repo.get_by_id.return_value = expected
        MockRepo.return_value = mock_repo

        service = HotelDetailService(mock_session)
        result = await service.get_detail(1, CHECK_IN, CHECK_OUT, adults=2)

    mock_repo.get_by_id.assert_awaited_once_with(1, CHECK_IN, CHECK_OUT, 2)
    assert result is expected


@pytest.mark.asyncio
async def test_service_returns_none_when_hotel_not_found():
    """get_detail debe retornar None cuando el hotel no existe en DB."""
    mock_session = AsyncMock()

    with patch(
        "src.domain.services.hotel_detail_service.HotelRepository"
    ) as MockRepo:
        mock_repo = AsyncMock()
        mock_repo.get_by_id.return_value = None
        MockRepo.return_value = mock_repo

        service = HotelDetailService(mock_session)
        result = await service.get_detail(999, CHECK_IN, CHECK_OUT, adults=2)

    assert result is None


@pytest.mark.asyncio
async def test_service_returns_hotel_detail_response_on_success():
    """get_detail debe retornar un HotelDetailResponse válido al encontrar el hotel."""
    mock_session = AsyncMock()
    expected = _make_hotel_detail()

    with patch(
        "src.domain.services.hotel_detail_service.HotelRepository"
    ) as MockRepo:
        mock_repo = AsyncMock()
        mock_repo.get_by_id.return_value = expected
        MockRepo.return_value = mock_repo

        service = HotelDetailService(mock_session)
        result = await service.get_detail(1, CHECK_IN, CHECK_OUT, adults=2)

    assert isinstance(result, HotelDetailResponse)
    assert result.id == 1
    assert len(result.rooms) == 1
    assert result.rating.score == 4.2
