"""Unit tests para los endpoints de identity-service (mocks de servicios y DB)."""

from datetime import datetime, timezone
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

_LOGIN_SVC = "src.api.v1.endpoints.login_user_service"
_REG_SVC = "src.api.v1.endpoints.register_user_service"
_JURISDICTION = "src.api.v1.endpoints.get_jurisdiction_by_iso_code"
_USER_BY_ID = "src.api.v1.endpoints.get_user_by_id"
_ROLE_BY_ID = "src.api.v1.endpoints.get_role_name_by_id"
_GUEST_BY_USER = "src.api.v1.endpoints.get_guest_by_user_id"

_NOW = datetime(2025, 12, 1, tzinfo=timezone.utc)

_LOGIN_OK = LoginResponse(
    status="ok",
    message="Login successful",
    user=LoginUserInfo(
        user_id=1, username="oscar", email="oscar@test.com", is_active=True
    ),
    permissions=["search"],
    session_ttl_seconds=3600,
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

# ── Health ─────────────────────────────────────────────────────────────────────


def test_health(client: TestClient) -> None:
    assert client.get("/health").json()["status"] == "ok"


# ── POST /identity/auth/web/login ──────────────────────────────────────────────


def test_web_login_ok(client: TestClient) -> None:
    with patch(_LOGIN_SVC, return_value=_LOGIN_OK):
        resp = client.post("/api/v1/identity/auth/web/login", json=_VALID_LOGIN)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


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
