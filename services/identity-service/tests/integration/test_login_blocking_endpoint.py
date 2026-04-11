import os
import uuid

import httpx

BASE_URL = os.getenv("IDENTITY_API_BASE_URL", "http://127.0.0.1:8001/api/v1")


def _register_user(client: httpx.Client, *, email: str, password: str) -> None:
    response = client.post(
        f"{BASE_URL}/identity/auth/register",
        json={
            "first_name": "Integration",
            "last_name": "User",
            "email": email,
            "document_type_id": 1,
            "document_id": f"CC-{uuid.uuid4().hex[:8]}",
            "jurisdiction_id": 1,
            "password": password,
            "password_confirmation": password,
        },
        timeout=10.0,
    )
    assert response.status_code == 200, response.text


def _login(client: httpx.Client, *, email: str, password: str) -> httpx.Response:
    return client.post(
        f"{BASE_URL}/identity/auth/web/login",
        json={"email": email, "password": password, "requested_jurisdiction": "CO"},
        timeout=10.0,
    )


def test_login_endpoint_blocks_after_three_failed_attempts() -> None:
    email = f"blocked.{uuid.uuid4().hex[:10]}@example.com"
    valid_password = "supersecurepass"

    with httpx.Client() as client:
        _register_user(client, email=email, password=valid_password)

        for _ in range(3):
            failed = _login(client, email=email, password="wrongpass123")
            assert failed.status_code == 401

        blocked = _login(client, email=email, password=valid_password)
        assert blocked.status_code == 429
        assert (
            blocked.json()["detail"]
            == "Too many failed login attempts. Try again later."
        )


def test_login_blocking_threshold_is_per_user() -> None:
    blocked_email = f"blocked.scope.{uuid.uuid4().hex[:10]}@example.com"
    allowed_email = f"allowed.scope.{uuid.uuid4().hex[:10]}@example.com"
    password = "supersecurepass"

    with httpx.Client() as client:
        _register_user(client, email=blocked_email, password=password)
        _register_user(client, email=allowed_email, password=password)

        for _ in range(3):
            failed = _login(client, email=blocked_email, password="wrongpass123")
            assert failed.status_code == 401

        blocked = _login(client, email=blocked_email, password=password)
        assert blocked.status_code == 429

        allowed = _login(client, email=allowed_email, password=password)
        assert allowed.status_code == 200
        assert allowed.json()["status"] == "authenticated"
