from pathlib import Path
import sys

from fastapi.testclient import TestClient
from src.main import app

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))


client = TestClient(app)


def test_health_payment() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "payment-service"


def test_payment_stub() -> None:
    response = client.post(
        "/api/v1/payments/authorize",
        json={
            "booking_id": "book_1",
            "amount": 100.0,
            "currency": "USD",
            "payment_method_token": "tok_123",
        },
    )
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU008"
