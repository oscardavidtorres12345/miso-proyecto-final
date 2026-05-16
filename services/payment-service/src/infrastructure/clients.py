import os
import time
from decimal import Decimal
from typing import Optional

import httpx
import stripe


class BookingClientError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class BookingTransportError(Exception):
    pass


class BookingClient:
    def __init__(self, base_url: Optional[str] = None, timeout_seconds: float = 12.0):
        self.base_url = base_url or os.getenv(
            "BOOKING_SERVICE_URL", "http://localhost:8004"
        )
        self.timeout_seconds = float(
            os.getenv("BOOKING_CLIENT_TIMEOUT_SECONDS", str(timeout_seconds))
        )
        self.max_retries = int(os.getenv("BOOKING_CLIENT_MAX_RETRIES", "5"))
        self.backoff_seconds = float(os.getenv("BOOKING_CLIENT_BACKOFF_SECONDS", "0.5"))

    def get_booking(self, booking_id: str) -> dict:
        return self._request(
            method="GET",
            path=f"/api/v1/bookings/{booking_id}",
            json=None,
            expected_status=200,
        )

    def get_booking_batch(self, booking_id: str) -> dict:
        return self._request(
            method="GET",
            path=f"/api/v1/bookings/batch/{booking_id}",
            json=None,
            expected_status=200,
        )

    def confirm_booking(self, booking_id: str, payment_id: str) -> dict:
        return self._request(
            method="POST",
            path=f"/api/v1/bookings/{booking_id}/confirm",
            json={"payment_id": payment_id},
            expected_status=200,
        )

    def _request(
        self,
        *,
        method: str,
        path: str,
        json: Optional[dict],
        expected_status: int,
    ) -> dict:
        url = f"{self.base_url.rstrip('/')}{path}"
        last_error: Optional[Exception] = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = httpx.request(
                    method=method,
                    url=url,
                    json=json,
                    timeout=self.timeout_seconds,
                )
            except httpx.HTTPError as exc:  # pragma: no cover
                last_error = exc
                if attempt < self.max_retries:
                    time.sleep(self.backoff_seconds * (2 ** (attempt - 1)))
                    continue
                raise BookingTransportError(
                    f"Booking service is unavailable after {self.max_retries} attempts."
                ) from exc

            if response.status_code >= 500 and attempt < self.max_retries:
                time.sleep(self.backoff_seconds * (2 ** (attempt - 1)))
                continue
            break
        else:  # pragma: no cover
            raise BookingTransportError(
                "Booking service is unavailable."
            ) from last_error

        if response.status_code == expected_status:
            return response.json()

        detail = "Booking request failed."
        try:
            payload = response.json()
            detail = payload.get("detail") or detail
        except ValueError:
            detail = response.text or detail

        raise BookingClientError(response.status_code, detail)


booking_client = BookingClient()


class StripeClientError(Exception):
    def __init__(
        self, message: str, stripe_error: Optional[stripe.error.StripeError] = None
    ):
        super().__init__(message)
        self.stripe_error = stripe_error


class StripeClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("STRIPE_SECRET_KEY")
        if self.api_key:
            stripe.api_key = self.api_key

    def create_payment_intent(
        self, *, amount: Decimal, currency: str, metadata: dict
    ) -> dict:
        if not self.api_key:
            raise StripeClientError("STRIPE_SECRET_KEY not configured")

        try:
            amount_in_cents = int(amount * 100)
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_in_cents,
                currency=currency.lower(),
                metadata=metadata,
                automatic_payment_methods={"enabled": True},
            )
            return payment_intent
        except stripe.error.StripeError as e:
            raise StripeClientError(f"Failed to create PaymentIntent: {str(e)}", e)

    def retrieve_payment_intent(self, payment_intent_id: str) -> dict:
        try:
            return stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            raise StripeClientError(f"Failed to retrieve PaymentIntent: {str(e)}", e)

    def create_refund(self, *, payment_intent_id: str, amount: Optional[int] = None) -> dict:
        if not self.api_key:
            raise StripeClientError("STRIPE_SECRET_KEY not configured")
        try:
            params: dict = {"payment_intent": payment_intent_id}
            if amount is not None:
                params["amount"] = amount
            refund = stripe.Refund.create(**params)
            return refund
        except stripe.error.StripeError as e:
            raise StripeClientError(f"Failed to create Refund: {str(e)}", e)


stripe_client = StripeClient()
