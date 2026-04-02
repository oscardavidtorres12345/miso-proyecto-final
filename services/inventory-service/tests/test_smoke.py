from datetime import timedelta
from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from src.main import app
from src.domain.services.inventory_service import inventory_service
from src.infrastructure.database.connection import Base, get_db

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
def reset_inventory_state() -> None:
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)


def test_health_inventory() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "inventory-service"


def _seed_stock_for_two_nights(room_id: int = 101) -> None:
    for day in ("2026-04-01", "2026-04-02"):
        response = client.post(
            "/api/v1/inventory/stock/upsert",
            json={
                "room_id": room_id,
                "date": day,
                "total_units": 1,
                "confirmed_units": 0,
            },
        )
        assert response.status_code == 200


def test_hold_lifecycle_confirm() -> None:
    _seed_stock_for_two_nights(room_id=101)

    hold = client.post(
        "/api/v1/inventory/holds",
        json={
            "room_id": 101,
            "user_id": "user-1",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    assert hold.status_code == 201
    hold_id = hold.json()["hold_id"]

    get_hold = client.get(f"/api/v1/inventory/holds/{hold_id}")
    assert get_hold.status_code == 200
    assert get_hold.json()["status"] == "ACTIVE"

    confirm = client.post(f"/api/v1/inventory/holds/{hold_id}/confirm")
    assert confirm.status_code == 200
    assert confirm.json()["status"] == "CONFIRMED"

    confirm_again = client.post(f"/api/v1/inventory/holds/{hold_id}/confirm")
    assert confirm_again.status_code == 409


def test_hold_conflict_when_inventory_unavailable() -> None:
    _seed_stock_for_two_nights(room_id=102)

    first = client.post(
        "/api/v1/inventory/holds",
        json={
            "room_id": 102,
            "user_id": "user-1",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    assert first.status_code == 201

    second = client.post(
        "/api/v1/inventory/holds",
        json={
            "room_id": 102,
            "user_id": "user-2",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    assert second.status_code == 409


def test_cancel_hold_releases_inventory() -> None:
    _seed_stock_for_two_nights(room_id=103)

    hold = client.post(
        "/api/v1/inventory/holds",
        json={
            "room_id": 103,
            "user_id": "user-1",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    hold_id = hold.json()["hold_id"]

    cancel = client.post(
        f"/api/v1/inventory/holds/{hold_id}/cancel",
        json={"reason": "user aborted"},
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "CANCELLED"

    second = client.post(
        "/api/v1/inventory/holds",
        json={
            "room_id": 103,
            "user_id": "user-2",
            "check_in": "2026-04-01",
            "check_out": "2026-04-03",
            "units": 1,
        },
    )
    assert second.status_code == 201


def test_expire_holds_endpoint() -> None:
    _seed_stock_for_two_nights(room_id=104)

    original_ttl = inventory_service._hold_ttl
    inventory_service._hold_ttl = timedelta(seconds=-1)
    try:
        hold = client.post(
            "/api/v1/inventory/holds",
            json={
                "room_id": 104,
                "user_id": "user-1",
                "check_in": "2026-04-01",
                "check_out": "2026-04-03",
                "units": 1,
            },
        )
        hold_id = hold.json()["hold_id"]

        expired = client.post("/api/v1/inventory/holds/expire")
        assert expired.status_code == 200
        assert expired.json()["expired_count"] >= 1

        get_hold = client.get(f"/api/v1/inventory/holds/{hold_id}")
        assert get_hold.status_code == 200
        assert get_hold.json()["status"] == "EXPIRED"
    finally:
        inventory_service._hold_ttl = original_ttl
