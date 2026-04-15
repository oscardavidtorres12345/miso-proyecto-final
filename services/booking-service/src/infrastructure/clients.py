import os

import httpx


class InventoryClientError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class InventoryTransportError(Exception):
    """Inventory service is unreachable or timed out."""


class IdentityClientError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class IdentityTransportError(Exception):
    """Identity service is unreachable or timed out."""


class PaymentClientError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class PaymentTransportError(Exception):
    """Payment service is unreachable or timed out."""


class SearchClientError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class SearchTransportError(Exception):
    """Search service is unreachable or timed out."""


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

    def cancel_hold(self, hold_id: str, *, reason: str | None = None) -> dict:
        return self._request(
            method="POST",
            path=f"/api/v1/inventory/holds/{hold_id}/cancel",
            json={"reason": reason},
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


class IdentityClient:
    def __init__(self, base_url: str | None = None, timeout_seconds: float = 5.0):
        self.base_url = base_url or os.getenv(
            "IDENTITY_SERVICE_URL", "http://identity-service:8000"
        )
        self.timeout_seconds = timeout_seconds

    def get_user_profile(self, user_id: str | int) -> dict:
        url = f"{self.base_url.rstrip('/')}/api/v1/identity/users/{user_id}"
        try:
            response = httpx.request(
                method="GET",
                url=url,
                timeout=self.timeout_seconds,
            )
        except httpx.HTTPError as exc:  # pragma: no cover
            raise IdentityTransportError("Identity service is unavailable.") from exc

        if response.status_code == 200:
            return response.json()

        detail = "Identity request failed."
        try:
            payload = response.json()
            detail = payload.get("detail") or detail
        except ValueError:
            detail = response.text or detail

        raise IdentityClientError(response.status_code, detail)


identity_client = IdentityClient()


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class PaymentClient:
    def __init__(self, base_url: str | None = None, timeout_seconds: float = 5.0):
        self.base_url = base_url or os.getenv(
            "PAYMENT_SERVICE_URL", "http://payment-service:8000"
        )
        self.timeout_seconds = timeout_seconds
        self.mock_enabled = _as_bool(os.getenv("PAYMENT_MOCK_ENABLED"), default=True)

    def get_payment_by_booking(self, booking_id: str) -> dict:
        if self.mock_enabled:
            return self._mock_payment_detail(booking_id)
        return self._request_payment_detail(booking_id)

    def _request_payment_detail(self, booking_id: str) -> dict:
        url = f"{self.base_url.rstrip('/')}/api/v1/payments/bookings/{booking_id}"
        try:
            response = httpx.request(
                method="GET",
                url=url,
                timeout=self.timeout_seconds,
            )
        except httpx.HTTPError as exc:  # pragma: no cover
            raise PaymentTransportError("Payment service is unavailable.") from exc

        if response.status_code == 200:
            return response.json()

        detail = "Payment request failed."
        try:
            payload = response.json()
            detail = payload.get("detail") or detail
        except ValueError:
            detail = response.text or detail

        raise PaymentClientError(response.status_code, detail)

    def _mock_payment_detail(self, booking_id: str) -> dict:
        return {
            "status": "ok",
            "booking_id": booking_id,
            "payment_id": f"mock-pay-{booking_id}",
            "payment_status": "AUTHORIZED",
            "lodging_amount": 3500000.0,
            "fees_amount": 500000.0,
            "taxes_amount": 1500000.0,
            "insurance_amount": 200000.0,
            "discount_amount": 700000.0,
            "total_amount": 5000000.0,
            "currency": "COP",
            "method_brand": "MOCK",
            "method_last4": "4242",
        }


payment_client = PaymentClient()


class SearchClient:
    def __init__(self, base_url: str | None = None, timeout_seconds: float = 5.0):
        self.base_url = base_url or os.getenv(
            "SEARCH_SERVICE_URL", "http://search-service:8000"
        )
        self.timeout_seconds = timeout_seconds
        self.mock_enabled = _as_bool(os.getenv("SEARCH_MOCK_ENABLED"), default=False)

    def get_hotel_detail(
        self,
        *,
        property_id: int,
        check_in: str,
        check_out: str,
        adults: int = 2,
    ) -> dict:
        return self._request(
            method="GET",
            path=f"/api/v1/hotels/{property_id}",
            params={"check_in": check_in, "check_out": check_out, "adults": adults},
            expected_status=200,
        )

    def get_booking_property_detail(
        self,
        *,
        room_id: int,
        check_in: str,
        check_out: str,
        units: int,
    ) -> dict:
        if self.mock_enabled:
            return self._mock_property_detail(room_id=room_id, units=units)

        return self._request(
            method="GET",
            path=f"/api/v1/hotels/rooms/{room_id}/detail",
            params={"check_in": check_in, "check_out": check_out, "units": units},
            expected_status=200,
        )

    def _request(
        self,
        *,
        method: str,
        path: str,
        params: dict | None,
        expected_status: int,
    ) -> dict:
        url = f"{self.base_url.rstrip('/')}{path}"
        try:
            response = httpx.request(
                method=method,
                url=url,
                params=params,
                timeout=self.timeout_seconds,
            )
        except httpx.HTTPError as exc:  # pragma: no cover
            raise SearchTransportError("Search service is unavailable.") from exc

        if response.status_code == expected_status:
            return response.json()

        detail = "Search request failed."
        try:
            payload = response.json()
            detail = payload.get("detail") or detail
        except ValueError:
            detail = response.text or detail

        raise SearchClientError(response.status_code, detail)

    def _mock_property_detail(self, *, room_id: int, units: int) -> dict:
        return {
            "status": "ok",
            "room_id": room_id,
            "hotel_name": "Aonang Villa Resort",
            "stars": 4,
            "city": "Cartagena de Indias",
            "country": "Colombia",
            "room_name": "Suite Junior",
            "meal_plan": "Desayuno incluido",
            "adults": max(2, units * 2),
        }


search_client = SearchClient()
