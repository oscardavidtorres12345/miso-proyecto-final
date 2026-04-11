"""
Unit tests for payment-service endpoints.
Todos los endpoints son stubs (not_implemented) — sin DB ni clientes externos.
"""

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

def test_refund_returns_not_implemented(client: TestClient) -> None:
    resp = client.post("/api/v1/payments/pay-001/refund")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "not_implemented"
    assert data["sprint"] == 3
    assert data["hu_id"] == "HU009"
    assert data["payment_id"] == "pay-001"


def test_refund_different_id(client: TestClient) -> None:
    resp = client.post("/api/v1/payments/pay-xyz-999/refund")
    assert resp.status_code == 200
    assert resp.json()["payment_id"] == "pay-xyz-999"


# ─── GET /payments/fx/quote ──────────────────────────────────────────────────

def test_fx_quote_returns_not_implemented(client: TestClient) -> None:
    resp = client.get(
        "/api/v1/payments/fx/quote",
        params={"from_currency": "USD", "to_currency": "COP", "amount": 100.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "not_implemented"
    assert data["hu_id"] == "HU020"


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
