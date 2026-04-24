"""Unit tests para los schemas de booking-service."""

import pytest
from datetime import date
from pydantic import ValidationError

from src.domain.schemas import BookingStatus, HoldRequest, QuoteRequest


class TestHoldRequest:
    def test_valid(self) -> None:
        r = HoldRequest(
            property_id=10,
            user_id="user-1",
            room_id=1,
            check_in=date(2025, 12, 1),
            check_out=date(2025, 12, 5),
        )
        assert r.units == 1  # default
        assert r.guest_count == 1  # default

    def test_checkout_before_checkin_raises(self) -> None:
        with pytest.raises(ValidationError, match="check_out must be after check_in"):
            HoldRequest(
                property_id=10,
                user_id="u",
                room_id=1,
                check_in=date(2025, 12, 5),
                check_out=date(2025, 12, 1),
            )

    def test_checkout_equal_checkin_raises(self) -> None:
        with pytest.raises(ValidationError):
            HoldRequest(
                property_id=10,
                user_id="u",
                room_id=1,
                check_in=date(2025, 12, 1),
                check_out=date(2025, 12, 1),
            )

    def test_units_must_be_at_least_one(self) -> None:
        with pytest.raises(ValidationError):
            HoldRequest(
                property_id=10,
                user_id="u",
                room_id=1,
                check_in=date(2025, 12, 1),
                check_out=date(2025, 12, 5),
                units=0,
            )

    def test_empty_user_id_raises(self) -> None:
        with pytest.raises(ValidationError):
            HoldRequest(
                property_id=10,
                user_id="",
                room_id=1,
                check_in=date(2025, 12, 1),
                check_out=date(2025, 12, 5),
            )


class TestQuoteRequest:
    def test_valid(self) -> None:
        r = QuoteRequest(hold_id="hold-123")
        assert r.hold_id == "hold-123"

    def test_missing_hold_id_raises(self) -> None:
        with pytest.raises(ValidationError):
            QuoteRequest()  # type: ignore


class TestBookingStatus:
    def test_enum_values(self) -> None:
        assert BookingStatus.ON_HOLD == "ON_HOLD"
        assert BookingStatus.CONFIRMED == "CONFIRMED"
        assert BookingStatus.CANCELLED == "CANCELLED"
        assert BookingStatus.EXPIRED == "EXPIRED"
