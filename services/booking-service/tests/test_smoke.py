from pathlib import Path
import sys
from datetime import datetime, timezone

import pytest

from fastapi.testclient import TestClient
from src.main import app
from src.domain.services.booking_service import booking_service
from src.infrastructure.clients import inventory_client

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_booking_state() -> None:
    booking_service.reset_state()


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

    created = client.post(
        "/api/v1/bookings/holds",
        json={
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
    assert len(body["bookings"]) == 1
    assert body["bookings"][0]["status"] == "ON_HOLD"


def test_booking_notification_email_stub() -> None:
    response = client.post("/api/v1/bookings/book_1/notifications/email")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU007"
