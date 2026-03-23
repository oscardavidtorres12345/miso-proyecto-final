from pathlib import Path
import sys

from fastapi.testclient import TestClient

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from src.main import app

client = TestClient(app)


def test_health_identity() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "identity-service"


def test_web_login_stub() -> None:
    response = client.post(
        "/api/v1/identity/auth/web/login",
        json={"email": "user@example.com", "password": "supersecurepass"},
    )
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU001"
