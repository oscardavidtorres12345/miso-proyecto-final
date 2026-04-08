"""
Smoke tests del currency-service.
Validan que el servicio arranca y los endpoints responden con los códigos esperados.
No requieren PostgreSQL ni APILayer — se mockea toda la infraestructura.
"""
from pathlib import Path
from unittest.mock import MagicMock, patch
import sys

from fastapi.testclient import TestClient

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

# Patch init_db antes de importar app para evitar conexión real a DB en tests
with patch("src.main.init_db"):
    from src.main import app

from src.infrastructure.database.session import get_db

app.dependency_overrides[get_db] = lambda: MagicMock()

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health checks
# ---------------------------------------------------------------------------

def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "currency-service"


def test_ready() -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"


# ---------------------------------------------------------------------------
# GET /api/v1/rates/latest
# ---------------------------------------------------------------------------

def test_latest_returns_404_when_no_snapshot() -> None:
    with patch("src.api.v1.endpoints.ExchangeRateService") as MockSvc:
        MockSvc.return_value.get_latest.return_value = None
        response = client.get("/api/v1/rates/latest")
    assert response.status_code == 404


def test_latest_returns_snapshot() -> None:
    from datetime import date, datetime, timezone
    fake = MagicMock()
    fake.id = 1
    fake.date = date(2026, 4, 7)
    fake.source = "USD"
    fake.quotes = {"USDCOP": 4180.5, "USDARS": 1040.2}
    fake.created_at = datetime(2026, 4, 8, 6, 0, 0, tzinfo=timezone.utc)
    fake.updated_at = datetime(2026, 4, 8, 6, 0, 0, tzinfo=timezone.utc)
    with patch("src.api.v1.endpoints.ExchangeRateService") as MockSvc:
        MockSvc.return_value.get_latest.return_value = fake
        response = client.get("/api/v1/rates/latest")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "USD"
    assert body["date"] == "2026-04-07"
    assert "USDCOP" in body["quotes"]


# ---------------------------------------------------------------------------
# GET /api/v1/rates/{date}
# ---------------------------------------------------------------------------

def test_rates_by_date_returns_404_when_not_found() -> None:
    with patch("src.api.v1.endpoints.ExchangeRateService") as MockSvc:
        MockSvc.return_value.get_by_date.return_value = None
        response = client.get("/api/v1/rates/2026-01-01")
    assert response.status_code == 404


def test_rates_by_date_returns_422_for_invalid_date() -> None:
    response = client.get("/api/v1/rates/not-a-date")
    assert response.status_code == 422
