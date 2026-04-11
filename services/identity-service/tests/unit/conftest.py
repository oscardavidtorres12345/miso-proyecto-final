"""
Fixtures para unit tests de identity-service.
identity-service no llama init_db() en main.py, solo importa get_db como dependencia.
"""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.infrastructure.database.connection import get_db


@pytest.fixture()
def mock_db() -> MagicMock:
    return MagicMock()


@pytest.fixture()
def client(mock_db: MagicMock) -> TestClient:
    # Save state so test_smoke.py module-level overrides are not wiped
    saved = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)
