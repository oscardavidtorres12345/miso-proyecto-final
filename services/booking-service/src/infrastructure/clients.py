import os

import httpx


class InventoryClientError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class InventoryTransportError(Exception):
    """Inventory service is unreachable or timed out."""


class InventoryClient:
    def __init__(self, base_url: str | None = None, timeout_seconds: float = 5.0):
        self.base_url = base_url or os.getenv(
            "INVENTORY_SERVICE_URL", "http://localhost:8006"
        )
        self.timeout_seconds = timeout_seconds

    def create_hold(
        self,
        *,
        room_id: int,
        user_id: str,
        check_in: str,
        check_out: str,
        units: int,
    ) -> dict:
        return self._request(
            method="POST",
            path="/api/v1/inventory/holds",
            json={
                "room_id": room_id,
                "user_id": user_id,
                "check_in": check_in,
                "check_out": check_out,
                "units": units,
            },
            expected_status=201,
        )

    def confirm_hold(self, hold_id: str) -> dict:
        return self._request(
            method="POST",
            path=f"/api/v1/inventory/holds/{hold_id}/confirm",
            json=None,
            expected_status=200,
        )

    def _request(
        self,
        *,
        method: str,
        path: str,
        json: dict | None,
        expected_status: int,
    ) -> dict:
        url = f"{self.base_url.rstrip('/')}{path}"
        try:
            response = httpx.request(
                method=method,
                url=url,
                json=json,
                timeout=self.timeout_seconds,
            )
        except httpx.HTTPError as exc:  # pragma: no cover
            raise InventoryTransportError("Inventory service is unavailable.") from exc

        if response.status_code == expected_status:
            return response.json()

        detail = "Inventory request failed."
        try:
            payload = response.json()
            detail = payload.get("detail") or detail
        except ValueError:
            detail = response.text or detail

        raise InventoryClientError(response.status_code, detail)


inventory_client = InventoryClient()
