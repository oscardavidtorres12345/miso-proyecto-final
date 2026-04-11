"""Unit tests para los schemas de inventory-service."""

import pytest
from datetime import date, datetime, timezone
from pydantic import ValidationError

from src.domain.schemas import (
    CancelHoldRequest,
    CreateHoldRequest,
    HoldStatus,
    StockUpsertRequest,
)


class TestStockUpsertRequest:
    def test_valid(self) -> None:
        r = StockUpsertRequest(
            room_id=1, date=date(2025, 12, 1), total_units=10, confirmed_units=3
        )
        assert r.available_units if hasattr(r, "available_units") else r.total_units == 10

    def test_confirmed_greater_than_total_raises(self) -> None:
        with pytest.raises(ValidationError, match="confirmed_units cannot be greater"):
            StockUpsertRequest(
                room_id=1, date=date(2025, 12, 1), total_units=5, confirmed_units=10
            )

    def test_negative_room_id_raises(self) -> None:
        with pytest.raises(ValidationError):
            StockUpsertRequest(room_id=0, date=date(2025, 12, 1), total_units=5)

    def test_confirmed_defaults_to_zero(self) -> None:
        r = StockUpsertRequest(room_id=1, date=date(2025, 12, 1), total_units=5)
        assert r.confirmed_units == 0


class TestCreateHoldRequest:
    def test_valid(self) -> None:
        r = CreateHoldRequest(
            room_id=1,
            user_id="user-abc",
            check_in=date(2025, 12, 1),
            check_out=date(2025, 12, 5),
        )
        assert r.units == 1  # default

    def test_checkout_before_checkin_raises(self) -> None:
        with pytest.raises(ValidationError, match="check_out must be after"):
            CreateHoldRequest(
                room_id=1,
                user_id="u",
                check_in=date(2025, 12, 5),
                check_out=date(2025, 12, 1),
            )

    def test_checkout_equal_checkin_raises(self) -> None:
        with pytest.raises(ValidationError):
            CreateHoldRequest(
                room_id=1,
                user_id="u",
                check_in=date(2025, 12, 1),
                check_out=date(2025, 12, 1),
            )

    def test_empty_user_id_raises(self) -> None:
        with pytest.raises(ValidationError):
            CreateHoldRequest(
                room_id=1,
                user_id="",
                check_in=date(2025, 12, 1),
                check_out=date(2025, 12, 5),
            )

    def test_units_must_be_at_least_one(self) -> None:
        with pytest.raises(ValidationError):
            CreateHoldRequest(
                room_id=1,
                user_id="u",
                check_in=date(2025, 12, 1),
                check_out=date(2025, 12, 5),
                units=0,
            )


class TestCancelHoldRequest:
    def test_reason_optional(self) -> None:
        r = CancelHoldRequest()
        assert r.reason is None

    def test_reason_accepted(self) -> None:
        r = CancelHoldRequest(reason="Guest changed plans")
        assert r.reason == "Guest changed plans"

    def test_reason_too_long_raises(self) -> None:
        with pytest.raises(ValidationError):
            CancelHoldRequest(reason="x" * 301)


class TestHoldStatus:
    def test_enum_values(self) -> None:
        assert HoldStatus.ACTIVE == "ACTIVE"
        assert HoldStatus.CONFIRMED == "CONFIRMED"
        assert HoldStatus.EXPIRED == "EXPIRED"
        assert HoldStatus.CANCELLED == "CANCELLED"
