from __future__ import annotations

import base64
import hashlib
import hmac
import importlib
import json
from datetime import datetime, timedelta, timezone, date
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from src.api.auth import resolve_request_user_id
from src.domain.schemas import BookingStatus
from src.domain.services.booking_service import (
    BookingService,
    BookingNotFoundError,
    BookingValidationError,
)
from src.domain.services.payment_summary_service import (
    build_payment_summary,
    PaymentSummaryError,
)

_SECRET = "travelhub-dev-secret"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _jwt(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h = _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(
        _SECRET.encode("utf-8"), f"{h}.{p}".encode("utf-8"), hashlib.sha256
    ).digest()
    return f"{h}.{p}.{_b64url(sig)}"


def test_booking_auth_branches() -> None:
    assert resolve_request_user_id(authorization=None, x_user_id=99) == 99

    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=None, x_user_id=None)
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization="Basic abc", x_user_id=None)

    tok = _jwt(
        {
            "sub": "7",
            "exp": int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp()),
        }
    )
    assert resolve_request_user_id(authorization=f"Bearer {tok}", x_user_id=None) == 7

    bad_sig = tok[:-1] + ("a" if tok[-1] != "a" else "b")
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=f"Bearer {bad_sig}", x_user_id=None)

    expired = _jwt(
        {
            "sub": "7",
            "exp": int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp()),
        }
    )
    with pytest.raises(HTTPException):
        resolve_request_user_id(authorization=f"Bearer {expired}", x_user_id=None)

    with pytest.raises(HTTPException):
        resolve_request_user_id(
            authorization=f"Bearer {_jwt({'sub': 'abc'})}", x_user_id=None
        )


def _mock_booking(
    booking_id: str, user_id: str = "u-1", status: str = BookingStatus.CONFIRMED.value
) -> MagicMock:
    b = MagicMock()
    b.booking_id = booking_id
    b.hold_id = f"hold-{booking_id}"
    b.room_id = 1
    b.user_id = user_id
    b.check_in = date(2025, 12, 1)
    b.check_out = date(2025, 12, 5)
    b.units = 1
    b.guest_count = 1
    b.status = status
    b.expires_at = None
    b.created_at = datetime.now(timezone.utc)
    b.hotel_confirmed_at = None
    b.property_id = 10
    b.property_name = "Hotel"
    b.city = "Cartagena"
    b.image_url = None
    return b


def test_booking_service_batch_flows() -> None:
    svc = BookingService()
    db = MagicMock()

    b1 = _mock_booking("bk-1")
    b2 = _mock_booking("bk-2")

    def _get(_model, booking_id):
        if booking_id in {"bk-1", "bk-2"}:
            return b1 if booking_id == "bk-1" else b2
        if booking_id == "batch-1":
            x = MagicMock()
            x.user_id = "u-1"
            return x
        return None

    db.get.side_effect = _get
    db.execute.return_value.scalars.return_value.all.return_value = [b2, b1]

    batch_id, summaries = svc.create_batch(
        db, user_id="u-1", booking_ids=["bk-1", "bk-2", "bk-1"]
    )
    assert batch_id
    assert len(summaries) == 2

    uid, rows = svc.get_batch(db, batch_booking_id="batch-1")
    assert uid == "u-1"
    assert len(rows) == 2

    with pytest.raises(BookingValidationError):
        svc.create_batch(db, user_id="u-1", booking_ids=[])

    b2.user_id = "other"
    with pytest.raises(BookingValidationError):
        svc.create_batch(db, user_id="u-1", booking_ids=["bk-1", "bk-2"])

    with pytest.raises(BookingNotFoundError):
        svc.get_batch(db, batch_booking_id="missing")


def test_payment_summary_error_branches() -> None:
    with pytest.raises(PaymentSummaryError):
        build_payment_summary(
            hotel_detail={
                "rooms": [
                    {
                        "id": 1,
                        "price": {
                            "pricePerNight": 1000,
                            "totalAmount": 2000,
                            "currency": "COP",
                        },
                    }
                ]
            },
            room_id=1,
            check_in=date(2025, 12, 2),
            check_out=date(2025, 12, 2),
            units=1,
        )

    with pytest.raises(PaymentSummaryError):
        build_payment_summary(
            hotel_detail={"rooms": []},
            room_id=99,
            check_in=date(2025, 12, 1),
            check_out=date(2025, 12, 3),
            units=1,
        )


def test_connection_and_main_bootstrap(monkeypatch: pytest.MonkeyPatch) -> None:
    connection_mod = importlib.import_module("src.infrastructure.database.connection")
    conftest_mod = importlib.import_module("tests.unit.conftest")

    closed = {"ok": False}

    class _DB:
        def close(self):
            closed["ok"] = True

    monkeypatch.setattr(connection_mod, "SessionLocal", lambda: _DB())
    gen = connection_mod.get_db()
    _ = next(gen)
    with pytest.raises(StopIteration):
        next(gen)
    assert closed["ok"] is True

    conftest_mod._patcher.stop()
    connection_mod = importlib.reload(connection_mod)
    called = {"ok": False}
    monkeypatch.setattr(
        connection_mod,
        "run_migrations",
        lambda *_args, **_kwargs: called.__setitem__("ok", True),
    )
    connection_mod.init_db()
    assert called["ok"] is True
    conftest_mod._patcher.start()

    import src.main as main_mod

    assert main_mod.ready()["status"] == "ready"
