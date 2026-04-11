"""
Fixtures para unit tests de booking-service.
init_db() se parchea a nivel de módulo antes de importar src.main.
"""

from unittest.mock import MagicMock, patch

import pytest

# ── Parchar init_db ANTES de importar src.main ────────────────────────────────
_patcher = patch("src.infrastructure.database.connection.init_db", return_value=None)
_patcher.start()

from fastapi.testclient import TestClient  # noqa: E402
from src.main import app  # noqa: E402
from src.infrastructure.database.connection import get_db  # noqa: E402


@pytest.fixture()
def mock_db() -> MagicMock:
    session = MagicMock()
    session.commit = MagicMock()
    session.rollback = MagicMock()
    session.add = MagicMock()
    session.refresh = MagicMock()
    return session


@pytest.fixture()
def client(mock_db: MagicMock) -> TestClient:
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
