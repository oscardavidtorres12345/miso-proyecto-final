"""
Unit tests para los endpoints de inventory-service.
inventory_service (singleton) se parchea con unittest.mock.patch en cada test.
"""

from datetime import date, datetime, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.domain.schemas import (
    CancelHoldResponse,
    ConfirmHoldResponse,
    HoldResponse,
    HoldStatus,
    RoomRateResponse,
    StockResponse,
)
from src.domain.services.inventory_service import (
    HoldConflictError,
    HoldExpiredError,
    HoldNotFoundError,
    InventoryUnavailableError,
)

# ── Helpers ────────────────────────────────────────────────────────────────────

_NOW = datetime(2025, 12, 1, 12, 0, 0, tzinfo=timezone.utc)
_DATE = date(2025, 12, 1)
_DATE_OUT = date(2025, 12, 5)

STOCK_RESP = StockResponse(
    room_id=1,
    date=_DATE,
    total_units=10,
    confirmed_units=2,
    held_units=1,
    available_units=7,
)

HOLD_RESP = HoldResponse(
    hold_id="hold-001",
    room_id=1,
    user_id="u-1",
    check_in=_DATE,
    check_out=_DATE_OUT,
    units=1,
    status=HoldStatus.ACTIVE,
    created_at=_NOW,
    expires_at=_NOW,
    updated_at=None,
)

CONFIRM_RESP = ConfirmHoldResponse(
    hold_id="hold-001", status=HoldStatus.CONFIRMED, confirmed_at=_NOW
)

CANCEL_RESP = CancelHoldResponse(
    hold_id="hold-001", status=HoldStatus.CANCELLED, cancelled_at=_NOW
)

ROOM_RATE_RESP = RoomRateResponse(
    room_id=1,
    room_type="Suite Junior",
    base_rate=100000,
    offer_rate=80000,
    offer_active=True,
    effective_rate=80000,
    currency="COP",
    occupied_units=15,
    total_units=20,
    availability="15/20",
    offer_status="Activa",
    updated_at=_NOW,
)

_SVC = "src.domain.services.inventory_service.inventory_service"

# ── Health ─────────────────────────────────────────────────────────────────────


def test_health(client: TestClient) -> None:
    assert client.get("/health").json()["status"] == "ok"


# ── POST /inventory/stock/upsert ───────────────────────────────────────────────


def test_upsert_stock_ok(client: TestClient) -> None:
    with patch(f"{_SVC}.upsert_stock", return_value=STOCK_RESP):
        resp = client.post(
            "/api/v1/inventory/stock/upsert",
            json={"room_id": 1, "date": "2025-12-01", "total_units": 10},
        )
    assert resp.status_code == 200
    assert resp.json()["room_id"] == 1


def test_upsert_stock_conflict(client: TestClient) -> None:
    with patch(
        f"{_SVC}.upsert_stock", side_effect=InventoryUnavailableError("no stock")
    ):
        resp = client.post(
            "/api/v1/inventory/stock/upsert",
            json={"room_id": 1, "date": "2025-12-01", "total_units": 10},
        )
    assert resp.status_code == 409


# ── POST /inventory/holds ──────────────────────────────────────────────────────


def test_create_hold_ok(client: TestClient) -> None:
    with patch(f"{_SVC}.create_hold", return_value=HOLD_RESP):
        resp = client.post(
            "/api/v1/inventory/holds",
            json={
                "room_id": 1,
                "user_id": "u-1",
                "check_in": "2025-12-01",
                "check_out": "2025-12-05",
            },
        )
    assert resp.status_code == 201
    assert resp.json()["hold_id"] == "hold-001"


def test_create_hold_unavailable(client: TestClient) -> None:
    with patch(f"{_SVC}.create_hold", side_effect=InventoryUnavailableError("full")):
        resp = client.post(
            "/api/v1/inventory/holds",
            json={
                "room_id": 1,
                "user_id": "u-1",
                "check_in": "2025-12-01",
                "check_out": "2025-12-05",
            },
        )
    assert resp.status_code == 409


# ── GET /inventory/holds/{id} ─────────────────────────────────────────────────


def test_get_hold_ok(client: TestClient) -> None:
    with patch(f"{_SVC}.get_hold", return_value=HOLD_RESP):
        resp = client.get("/api/v1/inventory/holds/hold-001")
    assert resp.status_code == 200


def test_get_hold_not_found(client: TestClient) -> None:
    with patch(f"{_SVC}.get_hold", side_effect=HoldNotFoundError("missing")):
        resp = client.get("/api/v1/inventory/holds/hold-xxx")
    assert resp.status_code == 404


# ── POST /inventory/holds/{id}/confirm ────────────────────────────────────────


def test_confirm_hold_ok(client: TestClient) -> None:
    with patch(f"{_SVC}.confirm_hold", return_value=CONFIRM_RESP):
        resp = client.post("/api/v1/inventory/holds/hold-001/confirm")
    assert resp.status_code == 200
    assert resp.json()["status"] == "CONFIRMED"


def test_confirm_hold_not_found(client: TestClient) -> None:
    with patch(f"{_SVC}.confirm_hold", side_effect=HoldNotFoundError("x")):
        resp = client.post("/api/v1/inventory/holds/hold-x/confirm")
    assert resp.status_code == 404


def test_confirm_hold_expired(client: TestClient) -> None:
    with patch(f"{_SVC}.confirm_hold", side_effect=HoldExpiredError("expired")):
        resp = client.post("/api/v1/inventory/holds/hold-001/confirm")
    assert resp.status_code == 410


def test_confirm_hold_conflict(client: TestClient) -> None:
    with patch(f"{_SVC}.confirm_hold", side_effect=HoldConflictError("conflict")):
        resp = client.post("/api/v1/inventory/holds/hold-001/confirm")
    assert resp.status_code == 409


# ── POST /inventory/holds/{id}/cancel ─────────────────────────────────────────


def test_cancel_hold_ok(client: TestClient) -> None:
    with patch(f"{_SVC}.cancel_hold", return_value=CANCEL_RESP):
        resp = client.post("/api/v1/inventory/holds/hold-001/cancel", json={})
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_cancel_hold_not_found(client: TestClient) -> None:
    with patch(f"{_SVC}.cancel_hold", side_effect=HoldNotFoundError("x")):
        resp = client.post("/api/v1/inventory/holds/hold-x/cancel", json={})
    assert resp.status_code == 404


def test_cancel_hold_expired(client: TestClient) -> None:
    with patch(f"{_SVC}.cancel_hold", side_effect=HoldExpiredError("e")):
        resp = client.post("/api/v1/inventory/holds/hold-001/cancel", json={})
    assert resp.status_code == 410


def test_cancel_hold_conflict(client: TestClient) -> None:
    with patch(f"{_SVC}.cancel_hold", side_effect=HoldConflictError("c")):
        resp = client.post("/api/v1/inventory/holds/hold-001/cancel", json={})
    assert resp.status_code == 409


# ── POST /inventory/holds/expire ──────────────────────────────────────────────


def test_expire_holds(client: TestClient) -> None:
    with patch(f"{_SVC}.expire_holds", return_value=3):
        resp = client.post("/api/v1/inventory/holds/expire")
    assert resp.status_code == 200
    assert resp.json()["expired_count"] == 3


def test_list_room_rates_ok(client: TestClient) -> None:
    with patch(f"{_SVC}.list_room_rates", return_value=[ROOM_RATE_RESP]):
        resp = client.get("/api/v1/inventory/rates")
    assert resp.status_code == 200
    assert resp.json()["rates"][0]["room_id"] == 1


def test_get_room_rate_ok(client: TestClient) -> None:
    with patch(f"{_SVC}.get_room_rate", return_value=ROOM_RATE_RESP):
        resp = client.get("/api/v1/inventory/rates/1")
    assert resp.status_code == 200
    assert resp.json()["room_type"] == "Suite Junior"


def test_upsert_room_rate_ok(client: TestClient) -> None:
    with (
        patch(f"{_SVC}.upsert_room_rate", return_value=ROOM_RATE_RESP),
        patch(
            f"{_SVC}.get_stock_window",
            return_value=[],
        ),
    ):
        resp = client.put(
            "/api/v1/inventory/rates/1",
            json={
                "room_type": "Suite Junior",
                "base_rate": 100000,
                "offer_rate": 80000,
                "occupied_units": 15,
                "total_units": 20,
                "offer_active": True,
                "currency": "COP",
                "horizon_days": 30,
            },
        )
    assert resp.status_code == 200
    assert resp.json()["effective_rate"] == 80000
