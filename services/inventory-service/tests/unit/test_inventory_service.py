"""
Unit tests para InventoryService.

Se mockea la Session de SQLAlchemy y se usan instancias reales de los modelos
SQLAlchemy en estado "transient" (sin sesión activa).
"""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock

import pytest

from src.domain.schemas import HoldStatus, StockUpsertRequest
from src.domain.services.inventory_service import (
    HoldConflictError,
    HoldExpiredError,
    HoldNotFoundError,
    InventoryService,
    InventoryUnavailableError,
)
from src.infrastructure.database.models import InventoryHold, InventoryStock

# ── Helpers ───────────────────────────────────────────────────────────────────


def _svc() -> InventoryService:
    return InventoryService(hold_ttl_minutes=15)


def _stock(
    room_id: int = 1,
    d: date = date(2025, 12, 1),
    total: int = 10,
    confirmed: int = 0,
    held: int = 0,
) -> InventoryStock:
    return InventoryStock(
        room_id=room_id,
        date=d,
        total_units=total,
        confirmed_units=confirmed,
        held_units=held,
    )


def _hold(status: str = HoldStatus.ACTIVE.value) -> InventoryHold:
    now = datetime.now(timezone.utc)
    return InventoryHold(
        hold_id="hold-001",
        room_id=1,
        user_id="u-1",
        check_in=date(2025, 12, 1),
        check_out=date(2025, 12, 3),
        units=1,
        status=status,
        created_at=now,
        expires_at=now,
        updated_at=None,
    )


def _mock_db() -> MagicMock:
    """DB session mock; expire_holds_locked returns empty list by default."""
    db = MagicMock()
    db.execute.return_value.scalars.return_value.all.return_value = []
    return db


# ── upsert_stock ─────────────────────────────────────────────────────────────


def test_upsert_stock_creates_new_entry() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = None  # no entry → create

    payload = StockUpsertRequest(
        room_id=1, date=date(2025, 12, 1), total_units=10, confirmed_units=0
    )
    result = svc.upsert_stock(db, payload)

    db.add.assert_called_once()
    db.commit.assert_called_once()
    assert result.room_id == 1
    assert result.total_units == 10
    assert result.available_units == 10


def test_upsert_stock_updates_existing_entry() -> None:
    svc = _svc()
    db = _mock_db()
    existing = _stock(total=5, confirmed=1, held=1)
    db.get.return_value = existing

    payload = StockUpsertRequest(
        room_id=1, date=date(2025, 12, 1), total_units=20, confirmed_units=2
    )
    result = svc.upsert_stock(db, payload)

    db.add.assert_not_called()
    db.commit.assert_called_once()
    assert result.total_units == 20


def test_upsert_stock_raises_when_over_capacity() -> None:
    svc = _svc()
    db = _mock_db()
    # after update: confirmed=8, held=4, total=10  →  12 > 10
    existing = _stock(total=10, confirmed=5, held=4)
    db.get.return_value = existing

    payload = StockUpsertRequest(
        room_id=1, date=date(2025, 12, 1), total_units=10, confirmed_units=8
    )
    with pytest.raises(InventoryUnavailableError):
        svc.upsert_stock(db, payload)


# ── get_hold ─────────────────────────────────────────────────────────────────


def test_get_hold_returns_response() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _hold()

    result = svc.get_hold(db, "hold-001")
    assert result.hold_id == "hold-001"
    assert result.status == HoldStatus.ACTIVE


def test_get_hold_raises_not_found() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = None

    with pytest.raises(HoldNotFoundError):
        svc.get_hold(db, "missing")


# ── expire_holds ─────────────────────────────────────────────────────────────


def test_expire_holds_returns_zero_when_nothing_expired() -> None:
    svc = _svc()
    db = _mock_db()  # execute().scalars().all() → []

    assert svc.expire_holds(db) == 0
    db.commit.assert_not_called()


# ── _date_range (static) ─────────────────────────────────────────────────────


def test_date_range_correct_nights() -> None:
    result = InventoryService._date_range(date(2025, 12, 1), date(2025, 12, 4))
    assert len(result) == 3
    assert result[0] == date(2025, 12, 1)
    assert result[-1] == date(2025, 12, 3)


def test_date_range_same_day_is_empty() -> None:
    assert InventoryService._date_range(date(2025, 12, 1), date(2025, 12, 1)) == []


# ── _available_units (static) ────────────────────────────────────────────────


def test_available_units_calculation() -> None:
    s = _stock(total=10, confirmed=3, held=2)
    assert InventoryService._available_units(s) == 5


# ── confirm_hold error paths ──────────────────────────────────────────────────


def test_confirm_hold_not_found() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = None

    with pytest.raises(HoldNotFoundError):
        svc.confirm_hold(db, "missing")


def test_confirm_hold_expired_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _hold(status=HoldStatus.EXPIRED.value)

    with pytest.raises(HoldExpiredError):
        svc.confirm_hold(db, "hold-001")


def test_confirm_hold_cancelled_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _hold(status=HoldStatus.CANCELLED.value)

    with pytest.raises(HoldConflictError):
        svc.confirm_hold(db, "hold-001")


def test_confirm_hold_already_confirmed_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _hold(status=HoldStatus.CONFIRMED.value)

    with pytest.raises(HoldConflictError):
        svc.confirm_hold(db, "hold-001")


# ── cancel_hold error paths ───────────────────────────────────────────────────


def test_cancel_hold_not_found() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = None

    with pytest.raises(HoldNotFoundError):
        svc.cancel_hold(db, "missing")


def test_cancel_hold_expired_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _hold(status=HoldStatus.EXPIRED.value)

    with pytest.raises(HoldExpiredError):
        svc.cancel_hold(db, "hold-001")


def test_cancel_hold_confirmed_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _hold(status=HoldStatus.CONFIRMED.value)

    with pytest.raises(HoldConflictError):
        svc.cancel_hold(db, "hold-001")


def test_cancel_hold_already_cancelled_raises() -> None:
    svc = _svc()
    db = _mock_db()
    db.get.return_value = _hold(status=HoldStatus.CANCELLED.value)

    with pytest.raises(HoldConflictError):
        svc.cancel_hold(db, "hold-001")
