"""
Smoke tests del hotel-service.
Validan que el servicio arranca correctamente y que los endpoints
responden con los códigos HTTP esperados.
"""
from pathlib import Path
from unittest.mock import AsyncMock, patch
import sys

from fastapi.testclient import TestClient
from src.main import app
from src.infrastructure.database.session import get_db

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))


# ---------------------------------------------------------------------------
# Override de la sesión de BD para no requerir PostgreSQL en CI
# ---------------------------------------------------------------------------

def _mock_db():
    """Sesión AsyncMock que sustituye a get_db en tests sin BD real."""
    return AsyncMock()


app.dependency_overrides[get_db] = _mock_db
client = TestClient(app)


# ---------------------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------------------

def test_health_hotel() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "hotel-service"


def test_ready_hotel() -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"


# ---------------------------------------------------------------------------
# HU004 — Detalle de hospedaje
# ---------------------------------------------------------------------------

def test_hotel_detail_returns_404_for_unknown_hotel() -> None:
    """Sin datos en BD, el endpoint debe retornar 404 (hotel no encontrado)."""
    with patch(
        "src.api.v1.endpoints.HotelDetailService"
    ) as MockService:
        mock_svc = AsyncMock()
        mock_svc.get_detail.return_value = None
        MockService.return_value = mock_svc

        response = client.get("/api/v1/hotels/99999")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_hotel_detail_returns_422_for_non_integer_id() -> None:
    """El hotel_id debe ser un entero; un string produce 422 Unprocessable Entity."""
    response = client.get("/api/v1/hotels/not_an_id")
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Stubs de sprints futuros (verifican que siguen disponibles)
# ---------------------------------------------------------------------------

def test_hotel_reservation_detail_stub() -> None:
    response = client.get("/api/v1/hotels/reservations/res_123")
    assert response.status_code == 200
    assert response.json()["hu_id"] == "HU014"
