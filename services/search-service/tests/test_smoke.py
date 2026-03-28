from pathlib import Path
import sys

from fastapi.testclient import TestClient
from src.main import app

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))


client = TestClient(app)


def test_health_search() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "search-service"


def test_search_stub() -> None:
    response = client.get(
        "/api/v1/search/hotels",
        params={
            "destination": "Bogota",
            "check_in": "2026-04-01",
            "check_out": "2026-04-04",
            "guests": 2,
        },
    )
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU002"


def test_autoscaling_signal_stub() -> None:
    response = client.get("/api/v1/search/ops/autoscaling/signal")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU022"


def test_mobile_search_stub() -> None:
    """HU016 — Endpoint mobile: verifica que el scaffolding retorna 200 con hu_id correcto."""
    response = client.get(
        "/api/v1/search/mobile",
        params={
            "destination": "Bogota",
            "check_in": "2026-04-01",
            "check_out": "2026-04-04",
            "guests": 2,
        },
    )
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU016"
