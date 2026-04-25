from __future__ import annotations

from unittest.mock import patch

import httpx
import pytest

from src.infrastructure.clients import (
    IdentityClient,
    IdentityClientError,
    IdentityTransportError,
    InventoryClient,
    InventoryClientError,
    PaymentClient,
    PaymentClientError,
    SearchClient,
    SearchClientError,
    _as_bool,
)


class _Resp:
    def __init__(self, status_code: int, payload: dict | None = None, text: str = ""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self) -> dict:
        if self._payload is None:
            raise ValueError("invalid json")
        return self._payload


def test_as_bool_variants() -> None:
    assert _as_bool(None, default=True) is True
    assert _as_bool("true", default=False) is True
    assert _as_bool("YES", default=False) is True
    assert _as_bool("0", default=True) is False


def test_inventory_client_create_hold_ok() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request", return_value=_Resp(201, {"ok": 1})
    ):
        result = client.create_hold(
            room_id=1,
            user_id="u1",
            check_in="2026-04-10",
            check_out="2026-04-11",
            units=1,
        )
    assert result == {"ok": 1}


def test_inventory_client_error_uses_detail_from_json() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(409, {"detail": "conflict"}),
    ):
        with pytest.raises(InventoryClientError, match="conflict"):
            client.confirm_hold("hold-1")


def test_inventory_client_error_falls_back_to_text() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(500, payload=None, text="boom"),
    ):
        with pytest.raises(InventoryClientError, match="boom"):
            client.cancel_hold("hold-1", reason="x")


def test_inventory_transport_error() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request",
        side_effect=httpx.HTTPError("down"),
    ):
        with pytest.raises(Exception, match="Inventory service is unavailable"):
            client.confirm_hold("hold-1")


def test_inventory_client_list_staff_properties_deduplicates() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    payload = {
        "rates": [
            {"property_id": 11, "property_name": "Hotel B"},
            {"property_id": 10, "property_name": "Hotel A"},
            {"property_id": 10, "property_name": ""},
        ]
    }
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(200, payload),
    ):
        result = client.list_staff_properties(99)
    assert result == [
        {"property_id": 10, "property_name": "Hotel A"},
        {"property_id": 11, "property_name": "Hotel B"},
    ]


def test_inventory_client_list_staff_property_ids_from_properties() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    payload = {"rates": [{"property_id": 20}, {"property_id": 10}]}
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(200, payload),
    ):
        result = client.list_staff_property_ids(99)
    assert result == [10, 20]


def test_inventory_client_list_staff_room_type_by_room_id() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    payload = {
        "rates": [
            {"room_id": 2, "room_type": "Suite Junior"},
            {"room_id": 2, "room_type": "Suite Junior Duplicate"},
            {"room_id": 3, "room_type": "Habitación Familiar"},
        ]
    }
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(200, payload),
    ):
        result = client.list_staff_room_type_by_room_id(99)
    assert result == {2: "Suite Junior", 3: "Habitación Familiar"}


def test_identity_client_ok_and_error_paths() -> None:
    client = IdentityClient(base_url="http://identity", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request", return_value=_Resp(200, {"user": 1})
    ):
        assert client.get_user_profile("10") == {"user": 1}

    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(404, {"detail": "not found"}),
    ):
        with pytest.raises(IdentityClientError, match="not found"):
            client.get_user_profile("10")


def test_identity_transport_error() -> None:
    client = IdentityClient(base_url="http://identity", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request", side_effect=httpx.HTTPError("x")
    ):
        with pytest.raises(IdentityTransportError):
            client.get_user_profile("10")


def test_payment_client_mock_and_real_paths() -> None:
    mock_client = PaymentClient(base_url="http://payment", timeout_seconds=1)
    mock_client.mock_enabled = True
    data = mock_client.get_payment_by_booking("bk-1")
    assert data["payment_id"] == "mock-pay-bk-1"
    assert data["currency"] == "COP"

    real_client = PaymentClient(base_url="http://payment", timeout_seconds=1)
    real_client.mock_enabled = False
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(200, {"status": "ok"}),
    ):
        assert real_client.get_payment_by_booking("bk-2") == {"status": "ok"}

    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(404, {"detail": "missing"}),
    ):
        with pytest.raises(PaymentClientError, match="missing"):
            real_client.get_payment_by_booking("bk-2")


def test_search_client_mock_and_real_paths() -> None:
    mock_client = SearchClient(base_url="http://search", timeout_seconds=1)
    mock_client.mock_enabled = True
    data = mock_client.get_booking_property_detail(
        room_id=201,
        check_in="2026-04-10",
        check_out="2026-04-12",
        units=1,
    )
    assert data["room_name"] == "Suite Junior"
    assert data["adults"] == 2

    real_client = SearchClient(base_url="http://search", timeout_seconds=1)
    real_client.mock_enabled = False
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(200, {"status": "ok"}),
    ):
        assert (
            real_client.get_booking_property_detail(
                room_id=201,
                check_in="2026-04-10",
                check_out="2026-04-12",
                units=1,
            )["status"]
            == "ok"
        )

    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(502, payload=None, text="bad gateway"),
    ):
        with pytest.raises(SearchClientError, match="bad gateway"):
            real_client.get_booking_property_detail(
                room_id=201,
                check_in="2026-04-10",
                check_out="2026-04-12",
                units=1,
            )


def test_inventory_fetch_staff_rates_error_and_non_dict_payload() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(500, payload=None, text="boom"),
    ):
        with pytest.raises(InventoryClientError, match="boom"):
            client.list_staff_properties(1)

    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(200, payload=[1, 2, 3]),
    ):
        assert client.list_staff_properties(1) == []


def test_inventory_room_types_skip_invalid_rows() -> None:
    client = InventoryClient(base_url="http://inventory", timeout_seconds=1)
    payload = {
        "rates": [
            {"room_id": "x", "room_type": "Suite"},
            {"room_id": 1, "room_type": "   "},
            {"room_id": 2, "room_type": "  Deluxe  "},
        ]
    }
    with patch(
        "src.infrastructure.clients.httpx.request", return_value=_Resp(200, payload)
    ):
        assert client.list_staff_room_type_by_room_id(1) == {2: "Deluxe"}


def test_identity_payment_search_extra_error_paths() -> None:
    id_client = IdentityClient(base_url="http://identity", timeout_seconds=1)
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(500, payload=None, text="id down"),
    ):
        with pytest.raises(IdentityClientError, match="id down"):
            id_client.get_user_profile("u")

    payment_client = PaymentClient(base_url="http://payment", timeout_seconds=1)
    payment_client.mock_enabled = False
    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(500, payload=None, text="pay down"),
    ):
        with pytest.raises(PaymentClientError, match="pay down"):
            payment_client.get_payment_by_booking("bk")

    with patch(
        "src.infrastructure.clients.httpx.request", side_effect=httpx.HTTPError("x")
    ):
        with pytest.raises(Exception):
            payment_client.get_payment_by_booking("bk")

    search_client = SearchClient(base_url="http://search", timeout_seconds=1)
    search_client.mock_enabled = False
    with patch(
        "src.infrastructure.clients.httpx.request", return_value=_Resp(200, {"ok": 1})
    ):
        assert search_client.get_hotel_detail(
            property_id=1, check_in="2026-01-01", check_out="2026-01-02", adults=2
        ) == {"ok": 1}

    with patch(
        "src.infrastructure.clients.httpx.request",
        return_value=_Resp(500, {"detail": "search down"}),
    ):
        with pytest.raises(SearchClientError, match="search down"):
            search_client.get_hotel_detail(
                property_id=1, check_in="2026-01-01", check_out="2026-01-02", adults=2
            )
