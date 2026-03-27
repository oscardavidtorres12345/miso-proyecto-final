"""
Pruebas unitarias para los schemas Pydantic de búsqueda (HU002).
Validan la lógica de validación sin dependencias externas.
"""
import pytest
from datetime import date, timedelta
from pydantic import ValidationError

from src.domain.schemas.search import SearchRequest, SearchResponse, PropertyResult

TODAY = date.today()
CHECK_IN = TODAY + timedelta(days=10)
CHECK_OUT = TODAY + timedelta(days=14)


# ---------------------------------------------------------------------------
# SearchRequest — campos obligatorios y validaciones
# ---------------------------------------------------------------------------

def test_search_request_valid_minimal():
    req = SearchRequest(destination="Cartagena", check_in=CHECK_IN, check_out=CHECK_OUT)
    assert req.destination == "Cartagena"
    assert req.adults == 1
    assert req.children == 0
    assert req.rooms == 1
    assert req.pets is False
    assert req.page == 1
    assert req.page_size == 10


def test_search_request_valid_full():
    req = SearchRequest(
        destination="Medellín",
        check_in=CHECK_IN,
        check_out=CHECK_OUT,
        adults=2,
        children=1,
        rooms=2,
        pets=True,
        price_min=100_000,
        price_max=500_000,
        amenities=["Piscina", "Restaurante"],
        accommodation_type=["Hotel", "Resort"],
        stars=[4, 5],
        meal_plan="Desayuno",
        page=2,
        page_size=20,
    )
    assert req.adults == 2
    assert req.pets is True
    assert req.amenities == ["Piscina", "Restaurante"]


def test_search_request_missing_destination_raises():
    with pytest.raises(ValidationError) as exc_info:
        SearchRequest(check_in=CHECK_IN, check_out=CHECK_OUT)
    assert "destination" in str(exc_info.value)


def test_search_request_missing_check_in_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogotá", check_out=CHECK_OUT)


def test_search_request_missing_check_out_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogotá", check_in=CHECK_IN)


def test_search_request_checkout_before_checkin_raises():
    with pytest.raises(ValidationError) as exc_info:
        SearchRequest(
            destination="Bogotá",
            check_in=CHECK_OUT,    # invertido a propósito
            check_out=CHECK_IN,
        )
    assert "check_out" in str(exc_info.value).lower() or "posterior" in str(exc_info.value)


def test_search_request_same_dates_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogotá", check_in=CHECK_IN, check_out=CHECK_IN)


def test_search_request_adults_zero_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogotá", check_in=CHECK_IN, check_out=CHECK_OUT, adults=0)


def test_search_request_children_negative_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogotá", check_in=CHECK_IN, check_out=CHECK_OUT, children=-1)


def test_search_request_page_size_exceeds_limit_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogotá", check_in=CHECK_IN, check_out=CHECK_OUT, page_size=100)


def test_search_request_price_min_negative_raises():
    with pytest.raises(ValidationError):
        SearchRequest(destination="Bogotá", check_in=CHECK_IN, check_out=CHECK_OUT, price_min=-1)


# ---------------------------------------------------------------------------
# PropertyResult — construcción de respuesta
# ---------------------------------------------------------------------------

def test_property_result_construction():
    result = PropertyResult(
        id=1,
        nombre="Hotel TravelHub",
        ubicacion_geog="Cartagena, Colombia",
        distancia_centro_km=1.5,
        tipo="Hotel",
        estrellas=4,
        amenidades=["Piscina", "Restaurante"],
        plan_alimentacion="Desayuno",
        acepta_mascotas=False,
        imagen_url="https://example.com/hotel.jpg",
        precio_total=4_760_000.0,
        precio_por_noche=1_000_000.0,
        moneda="COP",
        numero_noches=4,
        numero_adultos=2,
        rating=4.2,
        numero_resenas=200,
        etiqueta_rating="Muy bien",
    )
    assert result.incluye_impuestos is True
    assert result.leyenda_impuestos == "Incluye impuestos y cargos"
    assert result.moneda == "COP"
    assert result.etiqueta_rating == "Muy bien"


# ---------------------------------------------------------------------------
# SearchResponse — paginación
# ---------------------------------------------------------------------------

def test_search_response_empty():
    response = SearchResponse(results=[], total=0, page=1, page_size=10, total_pages=0)
    assert response.total == 0
    assert response.results == []

