"""Unit tests para los endpoints de identity-service (mocks de servicios y DB)."""

import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
import time
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from src.domain.schemas import LoginResponse, LoginUserInfo, RegisterResponse
from src.domain.services.login_service import (
    LoginUnauthorizedError,
    LoginValidationError,
)
from src.domain.services.registration_service import (
    RegistrationConflictError,
    RegistrationValidationError,
)
from src.domain.services.user_block_service import UserBlockNotFoundError

_LOGIN_SVC = "src.api.v1.endpoints.login_user_service"
_REG_SVC = "src.api.v1.endpoints.register_user_service"
_JURISDICTION = "src.api.v1.endpoints.get_jurisdiction_by_iso_code"
_USER_BY_ID = "src.api.v1.endpoints.get_user_by_id"
_ROLE_BY_ID = "src.api.v1.endpoints.get_role_name_by_id"
_GUEST_BY_USER = "src.api.v1.endpoints.get_guest_by_user_id"
_BLOCK_USER_SVC = "src.api.v1.endpoints.block_user_service"
_UNBLOCK_USER_SVC = "src.api.v1.endpoints.unblock_user_service"
_AUTO_BLOCK_USER_SVC = "src.api.v1.endpoints.auto_block_user_service"
_LIST_SECURITY_EVENTS_SVC = "src.api.v1.endpoints.list_security_events_service"

_NOW = datetime(2025, 12, 1, tzinfo=timezone.utc)

_LOGIN_OK = LoginResponse(
    status="ok",
    message="Login successful",
    user=LoginUserInfo(
        user_id=1,
        username="oscar",
        email="oscar@test.com",
        is_active=True,
        document_type="CC",
        document_id="123456",
    ),
    permissions=["search"],
    session_ttl_seconds=7200,
    session_expires_at=_NOW,
)

_REG_OK = RegisterResponse(
    status="created",
    sprint=1,
    hu_id="HU001",
    user_id=42,
    username="oscar",
    email="oscar@test.com",
    role="GUEST",
    jurisdiction_id=1,
    message="Registered",
)

_VALID_LOGIN = {"email": "oscar@test.com", "password": "secret123"}
_VALID_REG = {
    "first_name": "Oscar",
    "last_name": "Torres",
    "email": "oscar@test.com",
    "document_type_id": 1,
    "document_id": "123",
    "jurisdiction_id": 1,
    "password": "secret123",
    "password_confirmation": "secret123",
}


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _build_jwt(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_seg = _b64url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    payload_seg = _b64url_encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    )
    signing_input = f"{header_seg}.{payload_seg}".encode("utf-8")
    sig = hmac.new(
        b"travelhub-dev-secret",
        signing_input,
        hashlib.sha256,
    ).digest()
    sig_seg = _b64url_encode(sig)
    return f"{header_seg}.{payload_seg}.{sig_seg}"


# ── Health ─────────────────────────────────────────────────────────────────────


def test_health(client: TestClient) -> None:
    assert client.get("/health").json()["status"] == "ok"


# ── POST /identity/auth/web/login ──────────────────────────────────────────────


def test_web_login_ok(client: TestClient) -> None:
    with patch(_LOGIN_SVC, return_value=_LOGIN_OK):
        resp = client.post("/api/v1/identity/auth/web/login", json=_VALID_LOGIN)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["user"]["document_type"] == "CC"
    assert body["user"]["document_id"] == "123456"


def test_web_login_unauthorized(client: TestClient) -> None:
    with patch(_LOGIN_SVC, side_effect=LoginUnauthorizedError("bad creds")):
        resp = client.post("/api/v1/identity/auth/web/login", json=_VALID_LOGIN)
    assert resp.status_code == 401


def test_web_login_validation_error(client: TestClient) -> None:
    with patch(_LOGIN_SVC, side_effect=LoginValidationError("invalid")):
        resp = client.post("/api/v1/identity/auth/web/login", json=_VALID_LOGIN)
    assert resp.status_code == 422


def test_web_login_invalid_body(client: TestClient) -> None:
    resp = client.post("/api/v1/identity/auth/web/login", json={"email": "bad"})
    assert resp.status_code == 422


# ── GET /identity/auth/roles/{user_id} ────────────────────────────────────────


def test_get_roles(client: TestClient) -> None:
    resp = client.get("/api/v1/identity/auth/roles/user-123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == "user-123"
    assert "GUEST" in data["roles"]


# ── POST /identity/auth/register ──────────────────────────────────────────────


def test_register_ok(client: TestClient) -> None:
    with patch(_REG_SVC, return_value=_REG_OK):
        resp = client.post("/api/v1/identity/auth/register", json=_VALID_REG)
    assert resp.status_code == 200
    assert resp.json()["user_id"] == 42


def test_register_conflict(client: TestClient) -> None:
    with patch(_REG_SVC, side_effect=RegistrationConflictError("email exists")):
        resp = client.post("/api/v1/identity/auth/register", json=_VALID_REG)
    assert resp.status_code == 409


def test_register_validation_error(client: TestClient) -> None:
    with patch(_REG_SVC, side_effect=RegistrationValidationError("weak")):
        resp = client.post("/api/v1/identity/auth/register", json=_VALID_REG)
    assert resp.status_code == 422


# ── POST /identity/auth/portal/login & mobile/login ──────────────────────────


def test_portal_login_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/identity/auth/portal/login", json=_VALID_LOGIN)
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"


def test_mobile_login_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/identity/auth/mobile/login", json=_VALID_LOGIN)
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"


# ── GET /identity/users/{user_id} ──────────────────────────────────────────────


def test_get_user_profile_ok(client: TestClient) -> None:
    mock_user = MagicMock(
        user_id=42,
        username="oscar",
        email="oscar@test.com",
        role_id=1,
        is_active=True,
    )
    mock_guest = MagicMock(
        guest_id=10,
        full_name="Oscar Torres",
        document_type_id=1,
        document_id="123",
        contact_email="oscar@test.com",
        jurisdiction_id=1,
    )
    with (
        patch(_USER_BY_ID, return_value=mock_user),
        patch(_ROLE_BY_ID, return_value="GUEST"),
        patch(_GUEST_BY_USER, return_value=mock_guest),
    ):
        resp = client.get("/api/v1/identity/users/42")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["user"]["user_id"] == 42
    assert body["user"]["email"] == "oscar@test.com"
    assert body["guest"]["guest_id"] == 10


def test_get_user_profile_not_found(client: TestClient) -> None:
    with patch(_USER_BY_ID, return_value=None):
        resp = client.get("/api/v1/identity/users/999")
    assert resp.status_code == 404


# ── GET /identity/privacy/notices/{iso_code} ──────────────────────────────────


def test_privacy_notice_ok(client: TestClient) -> None:
    mock_jurisdiction = MagicMock(
        iso_code="CO",
        region_name="Colombia",
        applicable_regulation="Ley 1581",
        privacy_title="Política",
        privacy_content="Contenido",
        privacy_pdf_url=[],
        privacy_version="1.0",
        privacy_effective_at=None,
        privacy_contact_email="privacy@co.com",
    )
    with patch(_JURISDICTION, return_value=mock_jurisdiction):
        resp = client.get("/api/v1/identity/privacy/notices/CO")
    assert resp.status_code == 200
    assert resp.json()["iso_code"] == "CO"


def test_privacy_notice_not_found(client: TestClient) -> None:
    with patch(_JURISDICTION, return_value=None):
        resp = client.get("/api/v1/identity/privacy/notices/XX")
    assert resp.status_code == 404


# ── POST /identity/admin/users/{user_id}/block ───────────────────────────────


def test_block_user_ok(client: TestClient) -> None:
    with patch(
        _BLOCK_USER_SVC,
        return_value={
            "status": "blocked",
            "user_id": 42,
            "is_blocked": True,
            "severity": "HIGH",
            "unblock_policy": "MANUAL_ONLY",
            "blocked_until": None,
            "message": "User account blocked.",
        },
    ):
        resp = client.post(
            "/api/v1/identity/admin/users/42/block",
            json={"reason": "Fraud review", "ttl_minutes": 30},
            headers={"X-User-Permissions": "USER_BLOCK"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "blocked"
    assert body["is_blocked"] is True


def test_block_user_not_found(client: TestClient) -> None:
    with patch(
        _BLOCK_USER_SVC, side_effect=UserBlockNotFoundError("User '999' was not found.")
    ):
        resp = client.post(
            "/api/v1/identity/admin/users/999/block",
            json={"reason": "Fraud review", "ttl_minutes": 30},
            headers={"X-User-Permissions": "USER_BLOCK"},
        )
    assert resp.status_code == 404


def test_block_user_invalid_body(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/identity/admin/users/42/block",
        json={"reason": "x", "ttl_minutes": 0},
        headers={"X-User-Permissions": "USER_BLOCK"},
    )
    assert resp.status_code == 422


def test_block_user_forbidden_without_permission(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/identity/admin/users/42/block",
        json={"reason": "Fraud review", "ttl_minutes": 30},
    )
    assert resp.status_code == 403


def test_block_user_ok_with_user_jwt_permission(client: TestClient) -> None:
    token = _build_jwt(
        {
            "sub": "42",
            "permissions": ["USER_BLOCK"],
            "exp": int(time.time()) + 300,
        }
    )
    with patch(
        _BLOCK_USER_SVC,
        return_value={
            "status": "blocked",
            "user_id": 42,
            "is_blocked": True,
            "severity": "HIGH",
            "unblock_policy": "MANUAL_ONLY",
            "blocked_until": None,
            "message": "User account blocked.",
        },
    ):
        resp = client.post(
            "/api/v1/identity/admin/users/42/block",
            json={"reason": "Fraud review", "ttl_minutes": 30},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200


# ── POST /identity/admin/users/{user_id}/unblock ─────────────────────────────


def test_unblock_user_ok(client: TestClient) -> None:
    with patch(
        _UNBLOCK_USER_SVC,
        return_value={
            "status": "unblocked",
            "user_id": 42,
            "is_blocked": False,
            "severity": "LOW",
            "unblock_policy": "MANUAL_ONLY",
            "blocked_until": None,
            "message": "User account unblocked.",
        },
    ):
        resp = client.post(
            "/api/v1/identity/admin/users/42/unblock",
            json={"reason": "Manual review completed"},
            headers={"X-User-Permissions": "USER_UNBLOCK"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "unblocked"
    assert body["is_blocked"] is False


def test_unblock_user_not_found(client: TestClient) -> None:
    with patch(
        _UNBLOCK_USER_SVC,
        side_effect=UserBlockNotFoundError("User '999' was not found."),
    ):
        resp = client.post(
            "/api/v1/identity/admin/users/999/unblock",
            json={"reason": "Manual review completed"},
            headers={"X-User-Permissions": "USER_UNBLOCK"},
        )
    assert resp.status_code == 404


def test_unblock_user_forbidden_without_permission(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/identity/admin/users/42/unblock",
        json={"reason": "Manual review completed"},
    )
    assert resp.status_code == 403


# ── POST /identity/internal/security/users/{user_id}/auto-block ─────────────


def test_auto_block_user_ok(client: TestClient) -> None:
    with patch(
        _AUTO_BLOCK_USER_SVC,
        return_value={
            "status": "blocked",
            "user_id": 42,
            "is_blocked": True,
            "severity": "LOW",
            "unblock_policy": "AUTO_ON_TTL",
            "blocked_until": "2026-04-21T12:00:00Z",
            "message": "User account blocked automatically.",
        },
    ):
        resp = client.post(
            "/api/v1/identity/internal/security/users/42/auto-block",
            json={"reason": "Anomaly detected", "severity": "LOW", "ttl_minutes": 15},
            headers={"X-Internal-Token": "dev-internal-token"},
        )
    assert resp.status_code == 200
    assert resp.json()["unblock_policy"] == "AUTO_ON_TTL"


def test_auto_block_user_forbidden_without_internal_token(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/identity/internal/security/users/42/auto-block",
        json={"reason": "Anomaly detected", "severity": "LOW", "ttl_minutes": 15},
    )
    assert resp.status_code == 403


def test_auto_block_user_ok_with_service_jwt_scope(client: TestClient) -> None:
    token = _build_jwt(
        {
            "token_type": "service",
            "scope": "identity:auto_block",
            "exp": int(time.time()) + 300,
        }
    )
    with patch(
        _AUTO_BLOCK_USER_SVC,
        return_value={
            "status": "blocked",
            "user_id": 42,
            "is_blocked": True,
            "severity": "LOW",
            "unblock_policy": "AUTO_ON_TTL",
            "blocked_until": "2026-04-21T12:00:00Z",
            "message": "User account blocked automatically.",
        },
    ):
        resp = client.post(
            "/api/v1/identity/internal/security/users/42/auto-block",
            json={"reason": "Anomaly detected", "severity": "LOW", "ttl_minutes": 15},
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200


def test_get_security_events_ok(client: TestClient) -> None:
    with patch(
        _LIST_SECURITY_EVENTS_SVC,
        return_value={
            "total": 1,
            "limit": 50,
            "offset": 0,
            "items": [
                {
                    "event_id": 1,
                    "correlation_id": "corr-1",
                    "event_type": "USER_BLOCKED",
                    "severity": "HIGH",
                    "status": "OPEN",
                    "source_service": "identity-service",
                    "source_log_id": None,
                    "actor_user_id": 1,
                    "target_user_id": 42,
                    "source_ip": None,
                    "rule_code": "MANUAL_BLOCK",
                    "action_taken": "BLOCK_USER",
                    "blocked_until": None,
                    "event_timestamp": "2026-04-21T12:00:00Z",
                    "metadata": {"reason": "Fraud review"},
                }
            ],
        },
    ):
        resp = client.get(
            "/api/v1/identity/admin/security-events",
            headers={"X-User-Permissions": "SECURITY_EVENT_READ"},
        )
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["event_type"] == "USER_BLOCKED"


def test_get_security_events_forbidden_without_permission(client: TestClient) -> None:
    resp = client.get("/api/v1/identity/admin/security-events")
    assert resp.status_code == 403
