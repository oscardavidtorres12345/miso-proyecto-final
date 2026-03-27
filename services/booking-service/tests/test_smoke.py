from pathlib import Path
import sys

from fastapi.testclient import TestClient
from src.main import app

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))


client = TestClient(app)


def test_health_booking() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "booking-service"


def test_hold_stub() -> None:
    response = client.post(
        "/api/v1/bookings/holds",
        json={
            "hotel_id": "hotel_1",
            "room_id": "room_1",
            "user_id": "user_1",
            "check_in": "2026-04-01",
            "check_out": "2026-04-02",
        },
    )
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU005"


def test_booking_notification_email_stub() -> None:
    response = client.post("/api/v1/bookings/book_1/notifications/email")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU007"
