from __future__ import annotations

from decimal import Decimal
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
import stripe

from src.domain.services.webhook_service import WebhookService
from src.infrastructure.clients import (
    BookingClient,
    BookingClientError,
    BookingTransportError,
    StripeClient,
    StripeClientError,
)


def test_booking_client_success_and_error_paths(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = BookingClient(base_url="http://booking", timeout_seconds=1)

    ok_resp = SimpleNamespace(status_code=200, json=lambda: {"ok": True}, text="")
    monkeypatch.setattr("src.infrastructure.clients.httpx.request", lambda **_: ok_resp)
    assert client.get_booking("b1") == {"ok": True}

    bad_resp = SimpleNamespace(
        status_code=404,
        json=lambda: {"detail": "Not found"},
        text="",
    )
    monkeypatch.setattr(
        "src.infrastructure.clients.httpx.request", lambda **_: bad_resp
    )
    with pytest.raises(BookingClientError) as exc:
        client.get_booking("missing")
    assert exc.value.status_code == 404


def test_booking_client_transport_error(monkeypatch: pytest.MonkeyPatch) -> None:
    import httpx

    client = BookingClient(base_url="http://booking")

    def _boom(**_):
        raise httpx.ConnectError("down")

    monkeypatch.setattr("src.infrastructure.clients.httpx.request", _boom)
    with pytest.raises(BookingTransportError):
        client.get_booking("b1")


def test_stripe_client_create_and_retrieve(monkeypatch: pytest.MonkeyPatch) -> None:
    client = StripeClient(api_key="sk_test_123")

    monkeypatch.setattr(
        "src.infrastructure.clients.stripe.PaymentIntent.create",
        lambda **kwargs: {"id": "pi_1", **kwargs},
    )
    created = client.create_payment_intent(
        amount=Decimal("10.50"),
        currency="USD",
        metadata={"payment_id": "p1"},
    )
    assert created["id"] == "pi_1"
    assert created["amount"] == 1050

    monkeypatch.setattr(
        "src.infrastructure.clients.stripe.PaymentIntent.retrieve",
        lambda payment_intent_id: {"id": payment_intent_id},
    )
    assert client.retrieve_payment_intent("pi_2") == {"id": "pi_2"}


def test_stripe_client_error_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    no_key = StripeClient(api_key=None)
    with pytest.raises(StripeClientError, match="STRIPE_SECRET_KEY not configured"):
        no_key.create_payment_intent(amount=Decimal("1"), currency="USD", metadata={})

    client = StripeClient(api_key="sk_test_123")

    def _stripe_create_error(**_):
        raise stripe.error.APIError("bad")

    monkeypatch.setattr(
        "src.infrastructure.clients.stripe.PaymentIntent.create", _stripe_create_error
    )
    with pytest.raises(StripeClientError, match="Failed to create PaymentIntent"):
        client.create_payment_intent(amount=Decimal("2"), currency="USD", metadata={})


def test_webhook_service_status_transitions() -> None:
    db = Mock()
    db.execute.return_value.scalar_one_or_none.return_value = None
    svc = WebhookService()
    assert svc.is_already_processed(db, "evt_1") is False

    event = SimpleNamespace(event_id="e1")
    db.get.return_value = event

    processing = svc.mark_as_processing(db, "e1")
    assert processing.status == "PROCESSING"

    processed = svc.mark_as_processed(db, "e1")
    assert processed.status == "PROCESSED"
    assert processed.processed_at is not None

    failed = svc.mark_as_failed(db, "e1")
    assert failed.status == "FAILED"


def test_webhook_service_create_event() -> None:
    db = Mock()
    db.add = Mock()
    db.commit = Mock()
    db.refresh = Mock()

    captured = {}

    def _capture_refresh(obj):
        captured["event"] = obj

    db.refresh.side_effect = _capture_refresh
    svc = WebhookService()
    event = svc.create_webhook_event(
        db,
        stripe_event_id="evt_created",
        event_type="payment_intent.succeeded",
        payload={"id": "pi_1"},
        payment_id="p1",
    )

    assert event is captured["event"]
    assert event.stripe_event_id == "evt_created"
    assert event.event_type == "payment_intent.succeeded"
    assert event.status == "RECEIVED"
    assert event.received_at <= datetime.now(timezone.utc)


def test_webhook_service_missing_event_raises() -> None:
    db = Mock()
    db.get.return_value = None
    svc = WebhookService()
    with pytest.raises(ValueError, match="not found"):
        svc.mark_as_processing(db, "missing")
    with pytest.raises(ValueError, match="not found"):
        svc.mark_as_processed(db, "missing")
    with pytest.raises(ValueError, match="not found"):
        svc.mark_as_failed(db, "missing")
