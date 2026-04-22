"""
Unit tests para InventoryService.

Se mockea la Session de SQLAlchemy y se usan instancias reales de los modelos
SQLAlchemy en estado "transient" (sin sesión activa).
"""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock

import pytest

from src.domain.schemas import HoldStatus, RoomRateUpsertRequest, StockUpsertRequest
from src.domain.services.inventory_service import (
    HoldConflictError,
    HoldExpiredError,
    HoldNotFoundError,
    InventoryService,
    InventoryUnavailableError,
    RoomRateAccessDeniedError,
)
from src.infrastructure.database.models import (
    InventoryHold,
    InventoryRoomRate,
    InventoryStaffProperty,
    InventoryStock,
)

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


def test_create_hold_success_path_updates_held_units() -> None:
    svc = _svc()
    db = _mock_db()
    s1 = _stock(d=date(2025, 12, 1), total=10, confirmed=2, held=0)
    s2 = _stock(d=date(2025, 12, 2), total=10, confirmed=1, held=0)
    svc._load_stock_range = MagicMock(return_value=[s1, s2])  # type: ignore[method-assign]

    from src.domain.schemas import CreateHoldRequest

    payload = CreateHoldRequest(
        room_id=1,
        user_id="u-1",
        check_in=date(2025, 12, 1),
        check_out=date(2025, 12, 3),
        units=2,
    )

    result = svc.create_hold(db, payload)
    assert result.status == HoldStatus.ACTIVE
    assert s1.held_units == 2
    assert s2.held_units == 2


def test_confirm_hold_success_path() -> None:
    svc = _svc()
    db = _mock_db()
    hold = _hold(status=HoldStatus.ACTIVE.value)
    db.get.return_value = hold
    s1 = _stock(d=date(2025, 12, 1), total=10, confirmed=2, held=1)
    s2 = _stock(d=date(2025, 12, 2), total=10, confirmed=0, held=1)
    svc._load_stock_range = MagicMock(return_value=[s1, s2])  # type: ignore[method-assign]

    result = svc.confirm_hold(db, "hold-001")
    assert result.status == HoldStatus.CONFIRMED
    assert hold.status == HoldStatus.CONFIRMED.value
    assert s1.confirmed_units == 3 and s1.held_units == 0
    assert s2.confirmed_units == 1 and s2.held_units == 0


def test_cancel_hold_success_path() -> None:
    svc = _svc()
    db = _mock_db()
    hold = _hold(status=HoldStatus.ACTIVE.value)
    db.get.return_value = hold
    s1 = _stock(d=date(2025, 12, 1), total=10, confirmed=2, held=1)
    s2 = _stock(d=date(2025, 12, 2), total=10, confirmed=0, held=1)
    svc._load_stock_range = MagicMock(return_value=[s1, s2])  # type: ignore[method-assign]

    result = svc.cancel_hold(db, "hold-001")
    assert result.status == HoldStatus.CANCELLED
    assert hold.status == HoldStatus.CANCELLED.value
    assert s1.held_units == 0
    assert s2.held_units == 0


def test_upsert_room_rate_and_list_and_get_room_rate_success() -> None:
    svc = _svc()
    db = _mock_db()
    today = date.today()

    store: dict[tuple[str, int | str | date], object] = {}

    def _db_get(model, key):
        name = model.__name__
        if name == "InventoryRoomRate":
            return store.get((name, int(key)))
        if name == "InventoryStock":
            room_id, day = key
            return store.get((name, int(room_id), day))
        return None

    def _db_add(obj):
        if isinstance(obj, InventoryRoomRate):
            store[("InventoryRoomRate", obj.room_id)] = obj
        elif isinstance(obj, InventoryStock):
            store[("InventoryStock", obj.room_id, obj.date)] = obj
        elif isinstance(obj, InventoryStaffProperty):
            pass

    db.get.side_effect = _db_get
    db.add.side_effect = _db_add
    db.execute.return_value.scalars.return_value.all.return_value = [1]

    payload = RoomRateUpsertRequest(
        property_id=1,
        room_type="Suite Junior",
        base_rate=100000,
        offer_rate=80000,
        occupied_units=3,
        total_units=10,
        offer_active=True,
        currency="COP",
        horizon_days=1,
    )

    resp = svc.upsert_room_rate(db, room_id=1, payload=payload, staff_user_id=10)
    assert resp.room_id == 1
    assert resp.effective_rate == 80000

    list_db = _mock_db()
    list_db.execute.return_value.scalars.return_value.all.side_effect = [
        [1],  # allowed properties
        [store[("InventoryRoomRate", 1)]],  # inventory_room_rate query
        [1],  # allowed properties for get_room_rate
    ]
    list_db.get.side_effect = _db_get
    listed = svc.list_room_rates(list_db, staff_user_id=10)
    assert len(listed) == 1
    fetched = svc.get_room_rate(list_db, 1, staff_user_id=10)
    assert fetched.room_type == "Suite Junior"
    assert ("InventoryStock", 1, today) in store


def test_upsert_room_rate_rejects_non_allowed_property() -> None:
    svc = _svc()
    db = _mock_db()
    db.execute.return_value.scalars.return_value.all.return_value = [1]
    payload = RoomRateUpsertRequest(
        property_id=2,
        room_type="Suite",
        base_rate=100000,
        offer_rate=80000,
        occupied_units=1,
        total_units=2,
        offer_active=True,
        currency="COP",
        horizon_days=1,
    )
    with pytest.raises(RoomRateAccessDeniedError):
        svc.upsert_room_rate(db, room_id=1, payload=payload, staff_user_id=10)


def test_sync_catalog_updates_scope_and_existing_rate() -> None:
    svc = _svc()
    db = _mock_db()
    rate = InventoryRoomRate(
        room_id=1,
        property_id=1,
        staff_user_id=1,
        room_type="Old",
        base_rate=100000,
        offer_rate=80000,
        offer_active=True,
        currency="",
        updated_at=datetime.now(timezone.utc),
    )

    db.get.side_effect = (
        lambda model, key: rate if model.__name__ == "InventoryRoomRate" else None
    )
    db.execute.return_value.scalars.return_value.first.return_value = None

    result = svc.sync_catalog(
        db,
        rooms=[
            {"room_id": 1, "property_id": 1, "room_type": "Room 1", "country": "CO"}
        ],
        staff_by_country={"CO": 1},
    )
    assert result["total_rooms"] == 1
    assert result["updated_room_rates"] == 1
    assert rate.currency == "COP"
