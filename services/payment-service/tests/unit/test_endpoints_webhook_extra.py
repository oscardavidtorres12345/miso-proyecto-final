from __future__ import annotations

from types import SimpleNamespace
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient


class _Req:
    pass


def test_intent_maps_validation_conflict_gateway_errors(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from src.api.v1 import endpoints
    from src.domain.services.payment_service import (
        PaymentConflictError,
        PaymentGatewayError,
        PaymentValidationError,
    )

    monkeypatch.setattr(
        endpoints.payment_service,
        "create_payment_intent",
        lambda **_: (_ for _ in ()).throw(PaymentValidationError("bad")),
    )
    r = client.post(
        "/api/v1/payments/intent",
        json={"booking_id": "b1", "user_id": "u1", "amount": 10, "currency": "USD"},
    )
    assert r.status_code == 400

    monkeypatch.setattr(
        endpoints.payment_service,
        "create_payment_intent",
        lambda **_: (_ for _ in ()).throw(PaymentConflictError("dup")),
    )
    r = client.post(
        "/api/v1/payments/intent",
        json={"booking_id": "b1", "user_id": "u1", "amount": 10, "currency": "USD"},
    )
    assert r.status_code == 409

    monkeypatch.setattr(
        endpoints.payment_service,
        "create_payment_intent",
        lambda **_: (_ for _ in ()).throw(PaymentGatewayError("down")),
    )
    r = client.post(
        "/api/v1/payments/intent",
        json={"booking_id": "b1", "user_id": "u1", "amount": 10, "currency": "USD"},
    )
    assert r.status_code == 503


def test_get_status_not_found_and_completed_with_booking(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from src.api.v1 import endpoints
    from src.domain.services.payment_service import PaymentNotFoundError

    monkeypatch.setattr(
        endpoints.payment_service,
        "get_by_id",
        lambda *_: (_ for _ in ()).throw(PaymentNotFoundError("missing")),
    )
    r = client.get("/api/v1/payments/p404/status")
    assert r.status_code == 404

    payment = SimpleNamespace(
        payment_id="p1",
        booking_id="b1",
        status="COMPLETED",
        amount=10,
        currency="USD",
        created_at=datetime.now(timezone.utc),
        completed_at=None,
        failure_code=None,
        failure_message=None,
    )
    monkeypatch.setattr(endpoints.payment_service, "get_by_id", lambda *_: payment)
    monkeypatch.setattr(
        endpoints.booking_client, "get_booking", lambda *_: {"booking_id": "b1"}
    )
    r = client.get("/api/v1/payments/p1/status")
    assert r.status_code == 200
    assert r.json()["booking_confirmation_code"] == "b1"

    from src.infrastructure.clients import BookingClientError

    monkeypatch.setattr(
        endpoints.booking_client,
        "get_booking",
        lambda *_: (_ for _ in ()).throw(BookingClientError(503, "down")),
    )
    r = client.get("/api/v1/payments/p1/status")
    assert r.status_code == 200


def test_webhook_guardrails_and_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from src.api.v1 import endpoints

    # Missing secret
    monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
    r = client.post(
        "/api/v1/payments/webhook", data="{}", headers={"stripe-signature": "sig"}
    )
    assert r.status_code == 500

    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_1")
    monkeypatch.setattr(
        endpoints.stripe.Webhook,
        "construct_event",
        lambda *_: {
            "id": "evt_1",
            "type": "payment_intent.succeeded",
            "data": {"object": {"id": "pi_1", "metadata": {"payment_id": "p1"}}},
        },
    )
    monkeypatch.setattr(
        endpoints.webhook_service, "is_already_processed", lambda *_: False
    )
    monkeypatch.setattr(
        endpoints.webhook_service,
        "create_webhook_event",
        lambda **_: SimpleNamespace(event_id="e1"),
    )
    monkeypatch.setattr(
        endpoints.webhook_service, "mark_as_processing", lambda *_: None
    )
    monkeypatch.setattr(endpoints.webhook_service, "mark_as_processed", lambda *_: None)
    monkeypatch.setattr(
        endpoints.payment_service,
        "mark_as_completed",
        lambda **_: SimpleNamespace(booking_id="b1", payment_id="p1"),
    )
    monkeypatch.setattr(
        endpoints.booking_client,
        "get_booking_batch",
        lambda *_: {"bookings": [{"booking_id": "b1"}]},
    )
    monkeypatch.setattr(
        endpoints.booking_client, "confirm_booking", lambda *_: {"status": "ok"}
    )

    r = client.post(
        "/api/v1/payments/webhook", data="{}", headers={"stripe-signature": "sig"}
    )
    assert r.status_code == 200
    assert r.json()["status"] == "success"


def test_webhook_already_processed_failed_and_bad_payload(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from src.api.v1 import endpoints

    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_1")
    monkeypatch.setattr(
        endpoints.stripe.Webhook,
        "construct_event",
        lambda *_: {
            "id": "evt_2",
            "type": "payment_intent.payment_failed",
            "data": {
                "object": {
                    "id": "pi_2",
                    "last_payment_error": {"code": "x", "message": "y"},
                }
            },
        },
    )

    monkeypatch.setattr(
        endpoints.webhook_service, "is_already_processed", lambda *_: True
    )
    r = client.post(
        "/api/v1/payments/webhook", data="{}", headers={"stripe-signature": "sig"}
    )
    assert r.status_code == 200
    assert r.json()["status"] == "already_processed"

    monkeypatch.setattr(
        endpoints.webhook_service, "is_already_processed", lambda *_: False
    )
    monkeypatch.setattr(
        endpoints.webhook_service,
        "create_webhook_event",
        lambda **_: SimpleNamespace(event_id="e2"),
    )
    monkeypatch.setattr(
        endpoints.webhook_service, "mark_as_processing", lambda *_: None
    )
    monkeypatch.setattr(endpoints.webhook_service, "mark_as_processed", lambda *_: None)
    monkeypatch.setattr(endpoints.payment_service, "mark_as_failed", lambda **_: None)
    r = client.post(
        "/api/v1/payments/webhook", data="{}", headers={"stripe-signature": "sig"}
    )
    assert r.status_code == 200

    def _bad(*_):
        raise ValueError("bad payload")

    monkeypatch.setattr(endpoints.stripe.Webhook, "construct_event", _bad)
    r = client.post(
        "/api/v1/payments/webhook", data="{}", headers={"stripe-signature": "sig"}
    )
    assert r.status_code == 400


def test_webhook_signature_error_and_processing_exception(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from src.api.v1 import endpoints

    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_1")

    def _bad_signature(*_):
        raise endpoints.stripe.error.SignatureVerificationError(
            message="bad",
            sig_header="x",
            http_body=b"{}",
        )

    monkeypatch.setattr(endpoints.stripe.Webhook, "construct_event", _bad_signature)
    r = client.post(
        "/api/v1/payments/webhook", data="{}", headers={"stripe-signature": "sig"}
    )
    assert r.status_code == 400

    monkeypatch.setattr(
        endpoints.stripe.Webhook,
        "construct_event",
        lambda *_: {
            "id": "evt_3",
            "type": "payment_intent.succeeded",
            "data": {"object": {"id": "pi_3", "metadata": {"payment_id": "p3"}}},
        },
    )
    monkeypatch.setattr(
        endpoints.webhook_service, "is_already_processed", lambda *_: False
    )
    monkeypatch.setattr(
        endpoints.webhook_service,
        "create_webhook_event",
        lambda **_: SimpleNamespace(event_id="e3"),
    )
    monkeypatch.setattr(
        endpoints.webhook_service, "mark_as_processing", lambda *_: None
    )
    monkeypatch.setattr(endpoints.webhook_service, "mark_as_failed", lambda *_: None)
    monkeypatch.setattr(
        endpoints.payment_service,
        "mark_as_completed",
        lambda **_: (_ for _ in ()).throw(RuntimeError("boom")),
    )
    r = client.post(
        "/api/v1/payments/webhook", data="{}", headers={"stripe-signature": "sig"}
    )
    assert r.status_code == 500
