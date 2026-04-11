"""Unit tests para endpoints de booking-service (mock de DB, booking_service e inventory_client)."""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from src.domain.services.booking_service import BookingNotFoundError
from src.infrastructure.clients import InventoryClientError, InventoryTransportError

_SVC = "src.api.v1.endpoints.booking_service"
_CLIENT = "src.api.v1.endpoints.inventory_client"
_NOW = datetime(2025, 12, 1, tzinfo=timezone.utc)

_HOLD_PAYLOAD = {
    "user_id": "u-1", "room_id": 1,
    "check_in": "2025-12-01", "check_out": "2025-12-05",
}

# ── Helpers: mock booking DB objects ──────────────────────────────────────────

def _mock_booking(status: str = "ON_HOLD") -> MagicMock:
    b = MagicMock()
    b.booking_id = "bk-001"
    b.hold_id = "hold-001"
    b.status = status
    b.expires_at = None
    return b


# ── Health ─────────────────────────────────────────────────────────────────────

def test_health(client: TestClient) -> None:
    assert client.get("/health").json()["status"] == "ok"


# ── POST /bookings/holds ───────────────────────────────────────────────────────

def test_create_hold_ok(client: TestClient) -> None:
    hold_resp = {
        "hold_id": "hold-001", "room_id": 1, "user_id": "u-1",
        "check_in": "2025-12-01", "check_out": "2025-12-05",
        "units": 1, "status": "ACTIVE", "expires_at": None,
    }
    with patch(_CLIENT) as mock_client, patch(_SVC) as mock_svc:
        mock_client.create_hold.return_value = hold_resp
        mock_svc.create_on_hold.return_value = _mock_booking()
        resp = client.post("/api/v1/bookings/holds", json=_HOLD_PAYLOAD)
    assert resp.status_code == 201
    assert resp.json()["booking_id"] == "bk-001"
    assert resp.json()["hu_id"] == "HU005"


def test_create_hold_inventory_client_error(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client:
        mock_client.create_hold.side_effect = InventoryClientError(409, "no stock")
        resp = client.post("/api/v1/bookings/holds", json=_HOLD_PAYLOAD)
    assert resp.status_code == 409


def test_create_hold_transport_error(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client:
        mock_client.create_hold.side_effect = InventoryTransportError("timeout")
        resp = client.post("/api/v1/bookings/holds", json=_HOLD_PAYLOAD)
    assert resp.status_code == 503


def test_create_hold_invalid_payload_returns_422(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/holds", json={"room_id": 1})
    assert resp.status_code == 422


# ── POST /bookings/quote ───────────────────────────────────────────────────────

def test_quote_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/quote", json={"hold_id": "hold-001"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"
    assert resp.json()["hu_id"] == "HU006"


# ── GET /bookings/users/{user_id} ─────────────────────────────────────────────

def test_get_user_bookings_empty(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = []
        resp = client.get("/api/v1/bookings/users/u-1")
    assert resp.status_code == 200
    assert resp.json()["user_id"] == "u-1"
    assert resp.json()["bookings"] == []


# ── POST /bookings/{id}/confirm ───────────────────────────────────────────────

def test_confirm_booking_ok(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client, patch(_SVC) as mock_svc:
        mock_svc.get.return_value = _mock_booking()
        mock_client.confirm_hold.return_value = None
        mock_svc.mark_confirmed.return_value = _mock_booking("CONFIRMED")
        resp = client.post("/api/v1/bookings/bk-001/confirm")
    assert resp.status_code == 200
    assert resp.json()["status"] == "CONFIRMED"


def test_confirm_booking_not_found(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.get.side_effect = BookingNotFoundError("not found")
        resp = client.post("/api/v1/bookings/bk-xxx/confirm")
    assert resp.status_code == 404


# ── DELETE /bookings/{id} ─────────────────────────────────────────────────────

def test_cancel_booking_ok(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client, patch(_SVC) as mock_svc:
        mock_svc.get.return_value = _mock_booking()
        mock_client.cancel_hold.return_value = None
        mock_svc.mark_cancelled.return_value = _mock_booking("CANCELLED")
        resp = client.delete("/api/v1/bookings/bk-001")
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_cancel_booking_not_found(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.get.side_effect = BookingNotFoundError("not found")
        resp = client.delete("/api/v1/bookings/bk-xxx")
    assert resp.status_code == 404


# ── Stub endpoints ────────────────────────────────────────────────────────────

def test_mobile_booking_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/mobile", json=_HOLD_PAYLOAD)
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"


def test_push_notification_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/mobile/notifications/push")
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"
