import importlib
from unittest.mock import MagicMock, patch

import httpx
import pytest

from src.infrastructure.clients.search_catalog_client import (
    SearchCatalogClient,
    SearchCatalogError,
)
from src.infrastructure.clients.search_sync_client import (
    SearchSyncClient,
    SearchSyncError,
)

catalog_mod = importlib.import_module(
    "src.infrastructure.clients.search_catalog_client"
)
sync_mod = importlib.import_module("src.infrastructure.clients.search_sync_client")


def test_search_sync_client_skips_when_disabled(monkeypatch) -> None:
    monkeypatch.setenv("SEARCH_SYNC_ENABLED", "false")
    client = SearchSyncClient()
    with patch.object(sync_mod.httpx, "request") as req:
        client.sync_inventory(
            room_id=1,
            entries=[{"date": "2026-01-01", "total_units": 5, "confirmed_units": 1}],
        )
    req.assert_not_called()


def test_search_sync_client_inventory_success(monkeypatch) -> None:
    monkeypatch.setenv("SEARCH_SYNC_ENABLED", "true")
    monkeypatch.setenv("INTERNAL_API_TOKEN", "tok")
    client = SearchSyncClient()
    resp = MagicMock(status_code=200)
    with patch.object(sync_mod.httpx, "request", return_value=resp) as req:
        client.sync_inventory(
            room_id=7,
            entries=[{"date": "2026-01-01", "total_units": 5, "confirmed_units": 1}],
        )
    kwargs = req.call_args.kwargs
    assert kwargs["headers"]["X-Internal-Token"] == "tok"


def test_search_sync_client_rates_error_status(monkeypatch) -> None:
    monkeypatch.setenv("SEARCH_SYNC_ENABLED", "true")
    client = SearchSyncClient()
    resp = MagicMock(status_code=500, text="boom")
    resp.json.side_effect = ValueError()
    with patch.object(sync_mod.httpx, "request", return_value=resp):
        with pytest.raises(SearchSyncError):
            client.sync_rates(
                room_id=7,
                currency="COP",
                entries=[{"date": "2026-01-01", "amount": 100000}],
            )


def test_search_sync_client_transport_error(monkeypatch) -> None:
    monkeypatch.setenv("SEARCH_SYNC_ENABLED", "true")
    client = SearchSyncClient()
    with patch.object(
        sync_mod.httpx, "request", side_effect=httpx.HTTPError("network")
    ):
        with pytest.raises(SearchSyncError):
            client.sync_inventory(
                room_id=7,
                entries=[
                    {"date": "2026-01-01", "total_units": 5, "confirmed_units": 1}
                ],
            )


def test_search_catalog_client_fetch_rooms_success(monkeypatch) -> None:
    monkeypatch.setenv("INTERNAL_API_TOKEN", "tok")
    client = SearchCatalogClient()
    resp = MagicMock(status_code=200)
    resp.json.return_value = {"rooms": [{"room_id": 1}]}
    with patch.object(catalog_mod.httpx, "get", return_value=resp) as get:
        rooms = client.fetch_rooms()
    assert rooms == [{"room_id": 1}]
    assert get.call_args.kwargs["headers"]["X-Internal-Token"] == "tok"


def test_search_catalog_client_invalid_payload() -> None:
    client = SearchCatalogClient()
    resp = MagicMock(status_code=200)
    resp.json.return_value = {"rooms": "bad"}
    with patch.object(catalog_mod.httpx, "get", return_value=resp):
        with pytest.raises(SearchCatalogError):
            client.fetch_rooms()


def test_search_catalog_client_non_2xx() -> None:
    client = SearchCatalogClient()
    resp = MagicMock(status_code=503, text="down")
    resp.json.side_effect = ValueError()
    with patch.object(catalog_mod.httpx, "get", return_value=resp):
        with pytest.raises(SearchCatalogError):
            client.fetch_rooms()
