from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert, select
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from src.main import app
from src.infrastructure.database.connection import Base, get_db
from src.infrastructure.database.models import (
    AccessAuditLog,
    DocumentType,
    Jurisdiction,
    Permission,
    Role,
    RolePermission,
    UserAccount,
)

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))


TEST_ENGINE = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database() -> None:
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)

    with TestingSessionLocal.begin() as db:
        db.execute(insert(Role).values(role_id=1, role_name="GUEST", is_active=True))
        db.execute(
            insert(Permission).values(
                permission_id=1,
                permission_key="SEARCH_HOTELS",
                description="Can search hotels.",
            )
        )
        db.execute(insert(RolePermission).values(role_id=1, permission_id=1))
        db.execute(
            insert(Jurisdiction).values(
                jurisdiction_id=1,
                iso_code="CO",
                region_name="Colombia",
                applicable_regulation="HABEAS",
            )
        )
        db.execute(
            insert(DocumentType).values(
                document_type_id=1,
                document_type_name="DNI",
                description="Documento nacional de identidad",
            )
        )
        db.execute(
            insert(DocumentType).values(
                document_type_id=2,
                document_type_name="PASAPORTE",
                description="Documento de viaje internacional",
            )
        )


def test_health_identity() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "identity-service"


def test_web_login_success_with_permissions_and_access_log() -> None:
    register_response = client.post(
        "/api/v1/identity/auth/register",
        json={
            "first_name": "Web",
            "last_name": "User",
            "email": "web.user@example.com",
            "document_type_id": 1,
            "document_id": "CC-2001",
            "jurisdiction_id": 1,
            "password": "supersecurepass",
            "password_confirmation": "supersecurepass",
        },
    )
    assert register_response.status_code == 200

    response = client.post(
        "/api/v1/identity/auth/web/login",
        json={
            "email": "web.user@example.com",
            "password": "supersecurepass",
            "requested_jurisdiction": "CO",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "authenticated"
    assert body["permissions"] == ["SEARCH_HOTELS"]
    assert body["user"]["email"] == "web.user@example.com"
    assert body["user"]["role"] == "GUEST"
    assert body["session_ttl_seconds"] == 900
    assert body["session_expires_at"] is not None

    with TestingSessionLocal() as db:
        user = db.execute(
            select(UserAccount).where(UserAccount.email == "web.user@example.com")
        ).scalar_one()
        log = db.execute(
            select(AccessAuditLog)
            .where(AccessAuditLog.user_id == user.user_id)
            .order_by(AccessAuditLog.log_id.desc())
        ).scalar_one()
        assert log.access_result == "GRANTED"
        assert log.requested_jurisdiction == "CO"


def test_web_login_rejected_logs_failed_attempt() -> None:
    register_response = client.post(
        "/api/v1/identity/auth/register",
        json={
            "first_name": "Wrong",
            "last_name": "Password",
            "email": "wrong.password@example.com",
            "document_type_id": 1,
            "document_id": "CC-2002",
            "jurisdiction_id": 1,
            "password": "supersecurepass",
            "password_confirmation": "supersecurepass",
        },
    )
    assert register_response.status_code == 200

    response = client.post(
        "/api/v1/identity/auth/web/login",
        json={"email": "wrong.password@example.com", "password": "wrongpass123"},
    )
    assert response.status_code == 401

    with TestingSessionLocal() as db:
        user = db.execute(
            select(UserAccount).where(UserAccount.email == "wrong.password@example.com")
        ).scalar_one()
        log = db.execute(
            select(AccessAuditLog)
            .where(AccessAuditLog.user_id == user.user_id)
            .order_by(AccessAuditLog.log_id.desc())
        ).scalar_one()
        assert log.access_result == "REJECTED"
        assert log.rejection_reason == "Invalid credentials."


def test_register_user_default_role() -> None:
    response = client.post(
        "/api/v1/identity/auth/register",
        json={
            "first_name": "Ana",
            "last_name": "Gomez",
            "email": "ana.gomez@example.com",
            "document_type_id": 1,
            "document_id": "CC-1001",
            "jurisdiction_id": 1,
            "password": "supersecurepass",
            "password_confirmation": "supersecurepass",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "created"
    assert body["role"] == "GUEST"
    assert body["email"] == "ana.gomez@example.com"
    assert body["jurisdiction_id"] == 1


def test_register_user_with_explicit_guest_role() -> None:
    response = client.post(
        "/api/v1/identity/auth/register",
        json={
            "first_name": "Luis",
            "last_name": "Perez",
            "email": "luis.perez@example.com",
            "document_type_id": 1,
            "document_id": "CC-1002",
            "jurisdiction_id": 1,
            "password": "supersecurepass",
            "password_confirmation": "supersecurepass",
            "role": "GUEST",
        },
    )
    assert response.status_code == 200
    assert response.json()["role"] == "GUEST"


def test_register_user_password_confirmation_error() -> None:
    response = client.post(
        "/api/v1/identity/auth/register",
        json={
            "first_name": "Maria",
            "last_name": "Lopez",
            "email": "maria.lopez@example.com",
            "document_type_id": 1,
            "document_id": "CC-1003",
            "jurisdiction_id": 1,
            "password": "supersecurepass",
            "password_confirmation": "otrosecurepass",
        },
    )
    assert response.status_code == 422


def test_register_user_duplicate_email_error() -> None:
    payload = {
        "first_name": "Carlos",
        "last_name": "Ramirez",
        "email": "carlos.ramirez@example.com",
        "document_type_id": 1,
        "document_id": "CC-1004",
        "jurisdiction_id": 1,
        "password": "supersecurepass",
        "password_confirmation": "supersecurepass",
    }
    first_response = client.post("/api/v1/identity/auth/register", json=payload)
    second_response = client.post("/api/v1/identity/auth/register", json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 409


def test_register_user_invalid_jurisdiction_error() -> None:
    response = client.post(
        "/api/v1/identity/auth/register",
        json={
            "first_name": "Paula",
            "last_name": "Diaz",
            "email": "paula.diaz@example.com",
            "document_type_id": 1,
            "document_id": "CC-2001",
            "jurisdiction_id": 999,
            "password": "supersecurepass",
            "password_confirmation": "supersecurepass",
        },
    )
    assert response.status_code == 422


def test_register_user_invalid_document_type_error() -> None:
    response = client.post(
        "/api/v1/identity/auth/register",
        json={
            "first_name": "Pedro",
            "last_name": "Suarez",
            "email": "pedro.suarez@example.com",
            "document_type_id": 999,
            "document_id": "XYZ-2001",
            "jurisdiction_id": 1,
            "password": "supersecurepass",
            "password_confirmation": "supersecurepass",
        },
    )
    assert response.status_code == 422
