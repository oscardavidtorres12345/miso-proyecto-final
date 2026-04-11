"""Unit tests for payment-service Pydantic schemas."""

import pytest
from pydantic import ValidationError

from src.domain.schemas import FraudScreenRequest, PaymentRequest, PaymentResponse


class TestPaymentRequest:
    def test_valid(self) -> None:
        r = PaymentRequest(
            booking_id="b-1",
            amount=199.99,
            currency="USD",
            payment_method_token="tok_test",
        )
        assert r.booking_id == "b-1"
        assert r.amount == 199.99

    def test_missing_token_raises(self) -> None:
        with pytest.raises(ValidationError):
            PaymentRequest(booking_id="b", amount=10.0, currency="USD")  # type: ignore

    def test_missing_amount_raises(self) -> None:
        with pytest.raises(ValidationError):
            PaymentRequest(booking_id="b", currency="USD", payment_method_token="t")  # type: ignore


class TestFraudScreenRequest:
    def test_valid(self) -> None:
        r = FraudScreenRequest(user_id="u-1", amount=500.0, country="CO")
        assert r.country == "CO"

    def test_missing_country_raises(self) -> None:
        with pytest.raises(ValidationError):
            FraudScreenRequest(user_id="u", amount=10.0)  # type: ignore


class TestPaymentResponse:
    def test_payment_id_defaults_to_none(self) -> None:
        r = PaymentResponse(status="not_implemented", sprint=2, hu_id="HU008")
        assert r.payment_id is None

    def test_with_payment_id(self) -> None:
        r = PaymentResponse(
            status="ok", sprint=2, hu_id="HU008", payment_id="pay-123"
        )
        assert r.payment_id == "pay-123"
