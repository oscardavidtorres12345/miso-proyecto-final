"""
Pruebas de integración para GET /api/v1/search/properties (HU002).
Usa TestClient de FastAPI con mock del lifespan y SearchService — sin BD real.
"""
import pytest
from contextlib import asynccontextmanager
from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from main import app
from src.domain.schemas.search import SearchResponse, PropertyResult
from src.infrastructure.database.session import get_db, get_read_db

TODAY = date.today()
CHECK_IN = (TODAY + timedelta(days=10)).isoformat()
CHECK_OUT = (TODAY + timedelta(days=14)).isoformat()
NIGHTS = 4


def _mock_response(n: int = 2) -> SearchResponse:
    results = [
        PropertyResult(
            id=i,
            nombre=f"Hotel Cartagena {i}",
            ubicacion_geog="Cartagena, Colombia",
            distancia_centro_km=1.2 * i,
            tipo="Hotel",
            estrellas=4,
            amenidades=["Piscina", "Restaurante"],
            plan_alimentacion="Desayuno",
            acepta_mascotas=False,
            imagen_url="https://example.com/img.jpg",
            precio_total=4_760_000.0,
            precio_por_noche=1_000_000.0,
            moneda="COP",
            numero_noches=NIGHTS,
            numero_adultos=2,
            rating=4.2,
            numero_resenas=200,
            etiqueta_rating="Muy bien",
        )
        for i in range(1, n + 1)
    ]
    return SearchResponse(results=results, total=n, page=1, page_size=10, total_pages=1)


async def override_get_db():
    yield AsyncMock()


# Override both primary and read-replica sessions (PF-281)
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_read_db] = override_get_db


@asynccontextmanager
async def _mock_lifespan(application):
    """Lifespan sin conexión a BD ni Redis — sólo para tests."""
    yield


@pytest.fixture
def client():
    """TestClient con lifespan mockeado para evitar conexión a PostgreSQL."""
    with patch("main.lifespan", _mock_lifespan):
        app.router.lifespan_context = _mock_lifespan
        with TestClient(app) as c:
            yield c
        app.router.lifespan_context = None


# ---------------------------------------------------------------------------
# CA: Resultados de búsqueda — parámetros válidos
# ---------------------------------------------------------------------------

def test_search_returns_200_with_valid_params(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(2),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "adults": 2,
            },
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert len(body["results"]) == 2
    # CA: Precio mostrado incluye impuestos
    # El backend expone los datos; el frontend renderiza la leyenda "Incluye impuestos y cargos"
    result = body["results"][0]
    assert result["incluye_impuestos"] is True   # flag para el frontend
    assert result["precio_total"] > 0            # total con impuestos
    assert result["numero_noches"] == NIGHTS     # frontend: "X noches"
    assert result["numero_adultos"] == 2          # frontend: "X adultos"
    assert result["moneda"] == "COP"


# ---------------------------------------------------------------------------
# CA: Validación de campos obligatorios
# ---------------------------------------------------------------------------

def test_search_missing_destination_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={"check_in": CHECK_IN, "check_out": CHECK_OUT},
    )
    assert resp.status_code == 422


def test_search_missing_check_in_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={"destination": "Bogotá", "check_out": CHECK_OUT},
    )
    assert resp.status_code == 422


def test_search_missing_check_out_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={"destination": "Bogotá", "check_in": CHECK_IN},
    )
    assert resp.status_code == 422


def test_search_checkout_before_checkin_returns_422(client):
    resp = client.get(
        "/api/v1/search/properties",
        params={
            "destination": "Bogotá",
            "check_in": CHECK_OUT,   # invertido
            "check_out": CHECK_IN,
        },
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# CA: Filtros opcionales — se pasan correctamente
# ---------------------------------------------------------------------------

def test_search_with_pets_filter(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(1),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "pets": True,
            },
        )
    assert resp.status_code == 200


def test_search_with_stars_filter(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(1),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "stars": [4, 5],
            },
        )
    assert resp.status_code == 200


def test_search_with_price_range(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(0),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "price_min": 500_000,
                "price_max": 2_000_000,
            },
        )
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


# ---------------------------------------------------------------------------
# CA: Paginación
# ---------------------------------------------------------------------------

def test_search_pagination_params(client):
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=SearchResponse(
            results=[], total=100, page=2, page_size=5, total_pages=20
        ),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Medellín",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "page": 2,
                "page_size": 5,
            },
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["page"] == 2
    assert body["page_size"] == 5
    assert body["total_pages"] == 20


def test_search_with_country_filter(client):
    """HU023 PF-284: country param activa partition pruning en el shard correcto."""
    with patch(
        "src.api.v1.search.SearchService.search_properties",
        new_callable=AsyncMock,
        return_value=_mock_response(2),
    ):
        resp = client.get(
            "/api/v1/search/properties",
            params={
                "destination": "Cartagena",
                "check_in": CHECK_IN,
                "check_out": CHECK_OUT,
                "adults": 2,
                "country": "CO",  # activa partition pruning → sólo escanea propiedad_co
            },
        )
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

