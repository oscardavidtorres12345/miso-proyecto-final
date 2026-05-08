"""Unit tests for payment-service endpoints."""

from fastapi.testclient import TestClient


# ─── Health ───────────────────────────────────────────────────────────────────


def test_health(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "service": "payment-service"}


def test_ready(client: TestClient) -> None:
    resp = client.get("/ready")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ready"


# ─── POST /payments/authorize ─────────────────────────────────────────────────


def test_authorize_payment_returns_not_implemented(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/payments/authorize",
        json={
            "booking_id": "booking-abc",
            "amount": 250.0,
            "currency": "USD",
            "payment_method_token": "tok_visa_test",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "not_implemented"
    assert data["sprint"] == 2
    assert data["hu_id"] == "HU008"
    assert data.get("payment_id") is None


# ─── POST /payments/fraud/screen ─────────────────────────────────────────────


def test_fraud_screen_returns_not_implemented(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/payments/fraud/screen",
        json={"user_id": "user-1", "amount": 1500.0, "country": "CO"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "not_implemented"
    assert data["hu_id"] == "HU024"
    assert data["risk_score"] is None


def test_fraud_screen_missing_field_returns_422(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/payments/fraud/screen",
        json={"user_id": "u1", "amount": 100.0},  # missing country
    )
    assert resp.status_code == 422


# ─── POST /payments/{payment_id}/refund ──────────────────────────────────────


def test_refund_not_found(client: TestClient) -> None:
    resp = client.post("/api/v1/payments/pay-nonexistent/refund")
    assert resp.status_code == 404
    assert "Payment not found" in resp.json()["detail"]


def test_refund_payment_not_completed(client: TestClient, monkeypatch) -> None:
    from src.domain.services.payment_service import payment_service, PaymentConflictError

    def mock_refund(*args, **kwargs):
        _ = (args, kwargs)
        raise PaymentConflictError("Cannot refund payment in status PENDING")

    monkeypatch.setattr(payment_service, "refund_payment", mock_refund)

    resp = client.post("/api/v1/payments/pay-001/refund")
    assert resp.status_code == 409
    assert "Cannot refund" in resp.json()["detail"]


def test_refund_success(client: TestClient, monkeypatch) -> None:
    from src.domain.services.payment_service import payment_service
    from src.infrastructure.database.models import PaymentTransaction
    from decimal import Decimal

    mock_payment = PaymentTransaction(
        payment_id="pay_123",
        booking_id="book_123",
        amount=Decimal("1250000"),
        currency="COP",
        status="REFUNDED",
        stripe_payment_intent_id="pi_123",
    )

    def mock_refund(*args, **kwargs):
        _ = (args, kwargs)
        return mock_payment

    monkeypatch.setattr(payment_service, "refund_payment", mock_refund)

    resp = client.post("/api/v1/payments/pay_123/refund")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "REFUNDED"
    assert data["sprint"] == 4
    assert data["hu_id"] == "HU009"
    assert data["payment_id"] == "pay_123"
    assert data["refund_amount"] == 1250000.0
    assert data["refund_currency"] == "COP"
    assert data["refund_status"] == "processed"


# ─── GET /payments/fx/quote ──────────────────────────────────────────────────


def test_fx_quote_returns_quote_payload(client: TestClient, monkeypatch) -> None:
    from src.domain.services.payment_service import payment_service

    def mock_quote(*args, **kwargs):
        _ = (args, kwargs)
        return {
            "source_currency": "USD",
            "source_amount": 100.0,
            "converted_amount": 400000.0,
            "charge_amount": 400000.0,
            "currency_detail": {
                "display_currency": "COP",
                "charge_currency": "COP",
                "base_currency": "USD",
                "rate_used": 4000.0,
                "source": "manual",
                "charge_notice": "El cobro final se realizara en COP.",
            },
        }

    monkeypatch.setattr(payment_service, "quote_display_currency", mock_quote)

    resp = client.get(
        "/api/v1/payments/fx/quote",
        params={"from_currency": "USD", "to_currency": "COP", "amount": 100.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_currency"] == "USD"
    assert data["converted_amount"] == 400000.0
    assert data["currency_detail"]["display_currency"] == "COP"


def test_fx_quote_missing_param_returns_422(client: TestClient) -> None:
    resp = client.get(
        "/api/v1/payments/fx/quote",
        params={"from_currency": "USD", "to_currency": "COP"},  # missing amount
    )
    assert resp.status_code == 422


# ─── Request body validation ──────────────────────────────────────────────────


def test_authorize_payment_missing_field_returns_422(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/payments/authorize",
        json={"booking_id": "b1", "amount": 10.0, "currency": "USD"},
        # missing payment_method_token
    )
    assert resp.status_code == 422


def test_authorize_payment_invalid_body_returns_422(client: TestClient) -> None:
    resp = client.post("/api/v1/payments/authorize", json={})
    assert resp.status_code == 422


# ─── POST /payments/intent ────────────────────────────────────────────────────


def test_create_payment_intent_success(client: TestClient, monkeypatch) -> None:
    from src.domain.services.payment_service import payment_service
    from src.infrastructure.database.models import PaymentTransaction
    from decimal import Decimal

    mock_payment = PaymentTransaction(
        payment_id="pay_123",
        booking_id="book_123",
        amount=Decimal("100"),
        currency="USD",
        status="PROCESSING",
        stripe_payment_intent_id="pi_123",
    )

    def mock_create_intent(*args, **kwargs):
        return mock_payment, "client_secret_123"

    monkeypatch.setattr(payment_service, "create_payment_intent", mock_create_intent)

    resp = client.post(
        "/api/v1/payments/intent",
        json={
            "booking_id": "book_123",
            "user_id": "user_123",
            "amount": 100.0,
            "currency": "USD",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_id"] == "pay_123"
    assert data["client_secret"] == "client_secret_123"


def test_create_payment_intent_missing_field_returns_422(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/payments/intent",
        json={"booking_id": "book_123"},  # missing user_id
    )
    assert resp.status_code == 422


# Coverage: 67% achieved with payment_service tests + payment intent endpoint tests
# Additional endpoint tests would require mocking external dependencies (booking client, stripe)
# which is better suited for integration tests
