"""
Smoke tests del search-service (Pod Catalog/Search).
Validan que el servicio arranca y los endpoints responden con los códigos esperados.
"""
from pathlib import Path
from unittest.mock import AsyncMock, patch
import sys

from fastapi.testclient import TestClient
from src.main import app
from src.infrastructure.database.session import get_db, get_read_db

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

# Override de ambas sesiones para no requerir PostgreSQL en CI
app.dependency_overrides[get_read_db] = lambda: AsyncMock()
app.dependency_overrides[get_db] = lambda: AsyncMock()
client = TestClient(app)


# ---------------------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------------------

def test_health_search() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "search-service"



# ---------------------------------------------------------------------------
# Stubs de sprints futuros (siguen disponibles)
# ---------------------------------------------------------------------------

def test_search_stub() -> None:
    response = client.get(
        "/api/v1/search/hotels",
        params={"destination": "Bogota", "check_in": "2026-04-01",
                "check_out": "2026-04-04", "guests": 2},
    )
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU002"


def test_autoscaling_signal_stub() -> None:
    response = client.get("/api/v1/search/ops/autoscaling/signal")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU022"


def test_mobile_search_stub() -> None:
    response = client.get(
        "/api/v1/search/mobile",
        params={"destination": "Bogota", "check_in": "2026-04-01",
                "check_out": "2026-04-04", "guests": 2},
    )
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU016"


# ---------------------------------------------------------------------------
# HU004 — Detalle de hospedaje
# ---------------------------------------------------------------------------

def test_hotel_detail_returns_404_for_unknown_hotel() -> None:
    """Sin datos en BD el endpoint retorna 404."""
    with patch("src.api.v1.hotel.HotelDetailService") as MockSvc:
        mock_svc = AsyncMock()
        mock_svc.get_detail.return_value = None
        MockSvc.return_value = mock_svc
        response = client.get("/api/v1/hotels/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_hotel_detail_returns_422_for_non_integer_id() -> None:
    """hotel_id debe ser entero; un string produce 422."""
    response = client.get("/api/v1/hotels/not_an_id")
    assert response.status_code == 422
