from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from src.domain.services.inventory_service import (
    InventoryUnavailableError,
    RoomRateAccessDeniedError,
)
from src.infrastructure.clients import SearchCatalogError, SearchSyncError


def _payload() -> dict:
    return {
        "property_id": 9001,
        "room_type": "Suite Junior",
        "base_rate": 100000,
        "offer_rate": 80000,
        "occupied_units": 15,
        "total_units": 20,
        "offer_active": True,
        "currency": "COP",
        "horizon_days": 30,
    }


def test_create_room_rate_error_mappings(client: TestClient) -> None:
    with patch(
        "src.api.v1.endpoints.search_catalog_client.create_room",
        return_value={"room_id": 1},
    ):
        with patch(
            "src.api.v1.endpoints.inventory_service.create_room_rate",
            side_effect=InventoryUnavailableError("unavailable"),
        ):
            r = client.post(
                "/api/v1/inventory/rates", json=_payload(), headers={"X-User-Id": "10"}
            )
            assert r.status_code == 409

        with patch(
            "src.api.v1.endpoints.inventory_service.create_room_rate",
            side_effect=ValueError("bad"),
        ):
            r = client.post(
                "/api/v1/inventory/rates", json=_payload(), headers={"X-User-Id": "10"}
            )
            assert r.status_code == 422

        with patch(
            "src.api.v1.endpoints.inventory_service.create_room_rate",
            side_effect=RoomRateAccessDeniedError("forbidden"),
        ):
            r = client.post(
                "/api/v1/inventory/rates", json=_payload(), headers={"X-User-Id": "10"}
            )
            assert r.status_code == 403

    with patch(
        "src.api.v1.endpoints.search_catalog_client.create_room",
        side_effect=SearchCatalogError("catalog down"),
    ):
        r = client.post(
            "/api/v1/inventory/rates", json=_payload(), headers={"X-User-Id": "10"}
        )
        assert r.status_code == 503

    with (
        patch(
            "src.api.v1.endpoints.search_catalog_client.create_room",
            return_value={"room_id": 1},
        ),
        patch(
            "src.api.v1.endpoints.inventory_service.create_room_rate",
            side_effect=SearchSyncError("sync down"),
        ),
    ):
        r = client.post(
            "/api/v1/inventory/rates", json=_payload(), headers={"X-User-Id": "10"}
        )
        assert r.status_code == 503


def test_upsert_room_rate_error_mappings(client: TestClient) -> None:
    with patch(
        "src.api.v1.endpoints.inventory_service.upsert_room_rate",
        side_effect=InventoryUnavailableError("unavailable"),
    ):
        r = client.put(
            "/api/v1/inventory/rates/1", json=_payload(), headers={"X-User-Id": "10"}
        )
        assert r.status_code == 409

    with patch(
        "src.api.v1.endpoints.inventory_service.upsert_room_rate",
        side_effect=ValueError("bad"),
    ):
        r = client.put(
            "/api/v1/inventory/rates/1", json=_payload(), headers={"X-User-Id": "10"}
        )
        assert r.status_code == 422

    with patch(
        "src.api.v1.endpoints.inventory_service.upsert_room_rate",
        side_effect=RoomRateAccessDeniedError("forbidden"),
    ):
        r = client.put(
            "/api/v1/inventory/rates/1", json=_payload(), headers={"X-User-Id": "10"}
        )
        assert r.status_code == 403

    with patch(
        "src.api.v1.endpoints.inventory_service.upsert_room_rate",
        side_effect=SearchSyncError("sync down"),
    ):
        r = client.put(
            "/api/v1/inventory/rates/1", json=_payload(), headers={"X-User-Id": "10"}
        )
        assert r.status_code == 503


def test_endpoints_helper_functions(monkeypatch) -> None:
    from src.api.v1.endpoints import (
        _staff_by_country_mapping,
        _sync_inventory_rows,
        _sync_rate_rows,
    )

    monkeypatch.setenv("STAFF_USER_BY_COUNTRY", '{"co":"1","AR":2,"bad":"x"}')
    mapping = _staff_by_country_mapping()
    assert mapping["CO"] == 1
    assert mapping["AR"] == 2
    assert "BAD" not in mapping

    with patch("src.api.v1.endpoints.search_sync_client.sync_inventory") as si:
        _sync_inventory_rows(room_id=1, rows=[])
        si.assert_called_once()

    with patch("src.api.v1.endpoints.search_sync_client.sync_rates") as sr:
        _sync_rate_rows(room_id=1, currency="COP", rows=[])
        sr.assert_called_once()


def test_staff_mapping_invalid_json_raises(monkeypatch) -> None:
    from fastapi import HTTPException
    from src.api.v1.endpoints import _staff_by_country_mapping

    monkeypatch.setenv("STAFF_USER_BY_COUNTRY", "{bad json")
    try:
        _staff_by_country_mapping()
        assert False
    except HTTPException as exc:
        assert exc.status_code == 500
