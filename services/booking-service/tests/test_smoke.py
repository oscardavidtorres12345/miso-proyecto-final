from pathlib import Path
import sys
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.main import app
from src.api.v1 import endpoints
from src.infrastructure.clients import inventory_client, search_client
from src.infrastructure.clients import (
    identity_client,
    payment_client,
)
from src.infrastructure.database.connection import Base, get_db

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))


TEST_ENGINE = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_booking_db() -> None:
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)


@pytest.fixture(autouse=True)
def mock_search_hotel_detail(monkeypatch: pytest.MonkeyPatch) -> None:
    def _mock_hotel_detail(**_: object) -> dict:
        room_ids = [101, 200, 303, 401, 402, 403, 404, 999]
        return {
            "rooms": [
                {
                    "id": room_id,
                    "price": {
                        "pricePerNight": 100000,
                        "totalAmount": 238000,
                        "currency": "COP",
                    },
                }
                for room_id in room_ids
            ]
        }

    monkeypatch.setattr(search_client, "get_hotel_detail", _mock_hotel_detail)


def test_health_booking() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "booking-service"


def test_create_hold_success(monkeypatch: pytest.MonkeyPatch) -> None:
    def _mock_create_hold(**_: object) -> dict:
        return {
            "hold_id": "hold-123",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        }

    monkeypatch.setattr(inventory_client, "create_hold", _mock_create_hold)

    response = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 101,
            "user_id": "user_1",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["hu_id"] == "HU005"
    assert body["status"] == "ON_HOLD"
    assert body["booking_id"] is not None
    assert body["hold_id"] == "hold-123"


def test_confirm_booking_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-abc",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    monkeypatch.setattr(
        inventory_client,
        "confirm_hold",
        lambda hold_id: {"hold_id": hold_id, "status": "CONFIRMED"},
    )
    monkeypatch.setattr(
        identity_client,
        "get_user_profile",
        lambda user_id: {
            "status": "ok",
            "user": {"user_id": user_id, "email": "user_2@example.com"},
        },
    )
    monkeypatch.setattr(
        payment_client,
        "get_payment_by_booking",
        lambda booking_id: {
            "status": "ok",
            "booking_id": booking_id,
            "payment_id": f"mock-pay-{booking_id}",
        },
    )
    monkeypatch.setattr(
        search_client,
        "get_booking_property_detail",
        lambda **_: {
            "status": "ok",
            "hotel_name": "Aonang Villa Resort",
            "city": "Cartagena de Indias",
            "country": "Colombia",
            "room_name": "Suite Junior",
            "meal_plan": "Desayuno incluido",
            "adults": 2,
        },
    )

    created = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 200,
            "user_id": "user_2",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    booking_id = created.json()["booking_id"]

    confirmed = client.post(f"/api/v1/bookings/{booking_id}/confirm")
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "CONFIRMED"
    assert confirmed.json()["payment_summary"]["currency"] == "COP"


def test_user_bookings_returns_created_hold(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-user",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 303,
            "user_id": "user_3",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )

    response = client.get("/api/v1/bookings/users/user_3")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert len(body["bookings"]) >= 1
    assert any(b["status"] == "ON_HOLD" for b in body["bookings"])


def test_get_payment_summary_from_created_hold(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-summary",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    created = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 101,
            "user_id": "user_summary",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    booking_id = created.json()["booking_id"]

    summary = client.get(f"/api/v1/bookings/{booking_id}/payment-summary")
    assert summary.status_code == 200
    body = summary.json()
    assert body["property_id"] == 9001
    assert body["room_id"] == 101
    assert body["payment_summary"]["discount"] < 0
    assert body["payment_summary"]["currency"] == "COP"


def test_booking_notification_email_stub() -> None:
    response = client.post("/api/v1/bookings/book_1/notifications/email")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU007"


def test_cancel_booking_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-cancel",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    monkeypatch.setattr(
        inventory_client,
        "cancel_hold",
        lambda hold_id, reason=None: {
            "hold_id": hold_id,
            "status": "CANCELLED",
            "reason": reason,
        },
    )

    created = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 401,
            "user_id": "user_cancel",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    booking_id = created.json()["booking_id"]

    cancelled = client.delete(f"/api/v1/bookings/{booking_id}")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "CANCELLED"
    assert cancelled.json()["hu_id"] == "HU005"


def test_cancel_booking_hold_expired_returns_410(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-expired",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    def _raise_gone(hold_id: str, reason: str | None = None) -> dict:
        _ = (hold_id, reason)
        from src.infrastructure.clients import InventoryClientError

        raise InventoryClientError(410, "Hold already expired.")

    monkeypatch.setattr(inventory_client, "cancel_hold", _raise_gone)

    created = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 402,
            "user_id": "user_exp",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    booking_id = created.json()["booking_id"]

    cancelled = client.delete(f"/api/v1/bookings/{booking_id}")
    assert cancelled.status_code == 410


def test_cancel_booking_inventory_unavailable_returns_503(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-503",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    def _raise_unavailable(hold_id: str, reason: str | None = None) -> dict:
        _ = (hold_id, reason)
        from src.infrastructure.clients import InventoryTransportError

        raise InventoryTransportError("Inventory service is unavailable.")

    monkeypatch.setattr(inventory_client, "cancel_hold", _raise_unavailable)

    created = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 403,
            "user_id": "user_net",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    booking_id = created.json()["booking_id"]

    cancelled = client.delete(f"/api/v1/bookings/{booking_id}")
    assert cancelled.status_code == 503


def test_cancel_booking_twice_returns_409(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-double-cancel",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    monkeypatch.setattr(
        inventory_client,
        "cancel_hold",
        lambda hold_id, reason=None: {"hold_id": hold_id, "status": "CANCELLED"},
    )

    created = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 404,
            "user_id": "user_double",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    booking_id = created.json()["booking_id"]

    first = client.delete(f"/api/v1/bookings/{booking_id}")
    second = client.delete(f"/api/v1/bookings/{booking_id}")

    assert first.status_code == 200
    assert second.status_code == 409


def test_create_hold_returns_502_on_inventory_payload_mismatch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-mismatch",
            "room_id": 999,  # Different from payload room_id
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    response = client.post(
        "/api/v1/bookings/holds",
        json={
            "property_id": 9001,
            "room_id": 101,
            "user_id": "user_1",
            "check_in": "2026-04-10",
            "check_out": "2026-04-11",
            "units": 1,
        },
    )
    assert response.status_code == 502
    assert "room_id mismatch" in response.json()["detail"]


def test_create_hold_compensates_inventory_when_booking_persist_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        inventory_client,
        "create_hold",
        lambda **_: {
            "hold_id": "hold-to-cancel",
            "expires_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    cancelled: list[str] = []

    def _cancel_hold(hold_id: str, reason: str | None = None) -> dict:
        _ = reason
        cancelled.append(hold_id)
        return {"hold_id": hold_id, "status": "CANCELLED"}

    monkeypatch.setattr(inventory_client, "cancel_hold", _cancel_hold)

    original_create_on_hold = endpoints.booking_service.create_on_hold

    def _raise_db_error(*args, **kwargs):
        _ = (args, kwargs)
        raise SQLAlchemyError("db write failed")

    monkeypatch.setattr(endpoints.booking_service, "create_on_hold", _raise_db_error)

    try:
        response = client.post(
            "/api/v1/bookings/holds",
            json={
                "property_id": 9001,
                "room_id": 101,
                "user_id": "user_1",
                "check_in": "2026-04-10",
                "check_out": "2026-04-11",
                "units": 1,
            },
        )
        assert response.status_code == 503
        assert cancelled == ["hold-to-cancel"]
    finally:
        monkeypatch.setattr(
            endpoints.booking_service, "create_on_hold", original_create_on_hold
        )
