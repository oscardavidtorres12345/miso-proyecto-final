from pathlib import Path
import sys

from fastapi.testclient import TestClient

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from src.main import app

client = TestClient(app)


def test_health_hotel() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "hotel-service"


def test_hotel_detail_stub() -> None:
    response = client.get("/api/v1/hotels/hotel_123")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU004"


def test_hotel_reservation_detail_stub() -> None:
    response = client.get("/api/v1/hotels/reservations/res_123")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU014"
