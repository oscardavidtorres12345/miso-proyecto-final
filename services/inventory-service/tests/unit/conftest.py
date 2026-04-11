"""
Fixtures para unit tests de inventory-service.

init_db() se parchea a nivel de módulo antes de importar src.main
para que no intente conectarse a una base de datos real.
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
    """Sesión de SQLAlchemy simulada."""
    return MagicMock()


@pytest.fixture()
def client(mock_db: MagicMock) -> TestClient:
    """TestClient con get_db sobreescrito para no tocar la BD real."""
    app.dependency_overrides[get_db] = lambda: mock_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
