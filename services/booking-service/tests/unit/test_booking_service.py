"""
Unit tests para BookingService.

Se mockea la Session de SQLAlchemy; los objetos Booking devueltos por db.get
son MagicMock con los atributos correctos para que el service funcione.
"""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock

import pytest

from src.domain.schemas import BookingStatus
from src.domain.services.booking_service import (
    BookingConflictError,
    BookingNotFoundError,
    BookingService,
)

# ── Helpers ───────────────────────────────────────────────────────────────────


def _svc() -> BookingService:
    return BookingService()


def _mock_db() -> MagicMock:
    db = MagicMock()
    db.execute.return_value.scalars.return_value.all.return_value = []
    return db


def _mock_booking(status: str = BookingStatus.ON_HOLD.value) -> MagicMock:
    b = MagicMock()
    b.booking_id = "bk-001"
    b.hold_id = "hold-001"
    b.room_id = 1
    b.user_id = "u-1"
    b.check_in = date(2025, 12, 1)
    b.check_out = date(2025, 12, 5)
    b.units = 1
    b.status = status
    b.expires_at = None
    b.created_at = datetime.now(timezone.utc)
    b.updated_at = None
    return b


# ── create_on_hold ────────────────────────────────────────────────────────────


def test_create_on_hold_returns_booking() -> None:
    svc = _svc()
    db = _mock_db()

    result = svc.create_on_hold(
        db,
        hold_id="hold-001",
        room_id=1,
        property_id=10,
        user_id="u-1",
        check_in=date(2025, 12, 1),
        check_out=date(2025, 12, 5),
        units=1,
        expires_at=None,
        payment_summary_json='{"currency":"COP","total":1000}',
    )

    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()
    assert result.status == BookingStatus.ON_HOLD.value


# ── get ───────────────────────────────────────────────────────────────────────


def test_get_returns_booking() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking()

    result = svc.get(db, "bk-001")
    assert result.booking_id == "bk-001"


def test_get_raises_not_found() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = None

    with pytest.raises(BookingNotFoundError):
        svc.get(db, "missing-id")


# ── mark_confirmed ────────────────────────────────────────────────────────────


def test_mark_confirmed_ok() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.ON_HOLD.value)

    result = svc.mark_confirmed(db, "bk-001")
    assert result.status == BookingStatus.CONFIRMED.value
    db.commit.assert_called()


def test_mark_confirmed_already_confirmed_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.CONFIRMED.value)

    with pytest.raises(BookingConflictError):
        svc.mark_confirmed(db, "bk-001")


def test_mark_confirmed_cancelled_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.CANCELLED.value)

    with pytest.raises(BookingConflictError):
        svc.mark_confirmed(db, "bk-001")


# ── mark_expired ──────────────────────────────────────────────────────────────


def test_mark_expired_ok() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.ON_HOLD.value)

    result = svc.mark_expired(db, "bk-001")
    assert result.status == BookingStatus.EXPIRED.value


# ── mark_cancelled ────────────────────────────────────────────────────────────


def test_mark_cancelled_ok() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.ON_HOLD.value)

    result = svc.mark_cancelled(db, "bk-001")
    assert result.status == BookingStatus.CANCELLED.value


def test_mark_cancelled_already_cancelled_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.CANCELLED.value)

    with pytest.raises(BookingConflictError):
        svc.mark_cancelled(db, "bk-001")


def test_mark_cancelled_confirmed_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.CONFIRMED.value)

    with pytest.raises(BookingConflictError):
        svc.mark_cancelled(db, "bk-001")


def test_mark_cancelled_expired_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _mock_booking(BookingStatus.EXPIRED.value)

    with pytest.raises(BookingConflictError):
        svc.mark_cancelled(db, "bk-001")


# ── list_by_user ──────────────────────────────────────────────────────────────


def test_list_by_user_returns_empty() -> None:
    svc = _svc()
    db = _mock_db()  # execute().scalars().all() → []

    result = svc.list_by_user(db, "u-1")
    assert result == []


def test_list_by_user_returns_summaries() -> None:
    svc = _svc()
    db = _mock_db()
    mock_b = _mock_booking()
    db.execute.return_value.scalars.return_value.all.return_value = [mock_b]

    result = svc.list_by_user(db, "u-1")
    assert len(result) == 1
    assert result[0].booking_id == "bk-001"
