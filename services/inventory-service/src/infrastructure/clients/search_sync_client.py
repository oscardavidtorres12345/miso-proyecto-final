import os
from datetime import date

import httpx


class SearchSyncError(Exception):
    pass


class SearchSyncClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("SEARCH_SERVICE_URL", "http://search-service:8000")
        self.timeout_seconds = float(os.getenv("SEARCH_SYNC_TIMEOUT_SECONDS", "3"))
        self.internal_api_token = os.getenv(
            "INTERNAL_API_TOKEN", "travelhub-internal-dev-token"
        )
        self.enabled = os.getenv("SEARCH_SYNC_ENABLED", "false").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

    def sync_inventory(
        self,
        *,
        room_id: int,
        entries: list[dict],
    ) -> None:
        if not self.enabled or not entries:
            return
        payload = {
            "entries": [
                {
                    "date": self._iso(e["date"]),
                    "total_units": int(e["total_units"]),
                    "confirmed_units": int(e["confirmed_units"]),
                }
                for e in entries
            ]
        }
        self._request(
            method="PUT",
            path=f"/api/v1/internal/sync/inventory/rooms/{room_id}",
            json=payload,
        )

    def sync_rates(
        self,
        *,
        room_id: int,
        currency: str,
        entries: list[dict],
    ) -> None:
        if not self.enabled or not entries:
            return
        payload = {
            "currency": (currency or "COP").upper(),
            "entries": [
                {
                    "date": self._iso(e["date"]),
                    "amount": float(e["amount"]),
                }
                for e in entries
            ],
        }
        self._request(
            method="PUT",
            path=f"/api/v1/internal/sync/rates/rooms/{room_id}",
            json=payload,
        )

    def _request(self, *, method: str, path: str, json: dict) -> None:
        url = f"{self.base_url.rstrip('/')}{path}"
        try:
            response = httpx.request(
                method=method,
                url=url,
                json=json,
                headers={"X-Internal-Token": self.internal_api_token},
                timeout=self.timeout_seconds,
            )
        except httpx.HTTPError as exc:
            raise SearchSyncError("Search sync request failed.") from exc

        if response.status_code >= 300:
            detail = response.text or "Search sync request failed."
            try:
                body = response.json()
                detail = body.get("detail") or detail
            except ValueError:
                pass
            raise SearchSyncError(str(detail))

    @staticmethod
    def _iso(value: date | str) -> str:
        if isinstance(value, date):
            return value.isoformat()
        return str(value)


search_sync_client = SearchSyncClient()
