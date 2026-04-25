from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
import importlib

import httpx
import pytest
from sqlalchemy import create_engine, text

from src.api import auth as auth_mod
from src.api.auth import resolve_request_user_id
from src.infrastructure.clients.search_catalog_client import (
    SearchCatalogClient,
    SearchCatalogError,
)
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.migration_runner import _split_sql, run_migrations


def test_auth_invalid_claims_and_nbf_and_user_claim_none() -> None:
    tok = "bad"
    with pytest.raises(Exception):
        resolve_request_user_id(authorization=f"Bearer {tok}", x_user_id=None)

    # token with non-numeric sub should fail user extraction
    header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    payload = "eyJzdWIiOiJhYmMiLCJleHAiOjk5OTk5OTk5OTl9"
    sig = "invalid"
    with pytest.raises(Exception):
        resolve_request_user_id(
            authorization=f"Bearer {header}.{payload}.{sig}", x_user_id=None
        )


def test_auth_algorithm_branches(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth_mod, "_JWT_ALGORITHM", "HS512")
    with pytest.raises(Exception):
        auth_mod._verify_hs256("a.b.c")


def test_connection_get_db_and_init_db(monkeypatch: pytest.MonkeyPatch) -> None:
    connection_mod = importlib.import_module("src.infrastructure.database.connection")
    closed = {"ok": False}

    class _DB:
        def close(self):
            closed["ok"] = True

    monkeypatch.setattr(connection_mod, "SessionLocal", lambda: _DB())
    gen = get_db()
    _ = next(gen)
    with pytest.raises(StopIteration):
        next(gen)
    assert closed["ok"] is True

    # Temporarily disable global patch from tests/unit/conftest.py to exercise real init_db
    conftest_mod = importlib.import_module("tests.unit.conftest")
    conftest_mod._patcher.stop()
    connection_mod = importlib.reload(connection_mod)

    called = {"ok": False}

    def _run(engine, migrations_dir):
        _ = (engine, migrations_dir)
        called["ok"] = True

    monkeypatch.setattr(connection_mod, "run_migrations", _run)
    connection_mod.init_db()
    assert called["ok"] is True

    # Restore patch to keep isolation for the rest of the suite
    conftest_mod._patcher.start()


def test_migration_runner_paths(tmp_path: Path) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    d = tmp_path / "migrations"
    d.mkdir(parents=True, exist_ok=True)
    (d / "0001.sql").write_text(
        "CREATE TABLE t(id INTEGER PRIMARY KEY);INSERT INTO t(id) VALUES(1);",
        encoding="utf-8",
    )

    assert _split_sql("a; ;b;") == ["a", "b"]

    run_migrations(engine, d)
    run_migrations(engine, d)
    with engine.begin() as conn:
        assert conn.execute(text("SELECT COUNT(*) FROM t")).scalar_one() == 1


def test_catalog_client_error_branches(monkeypatch: pytest.MonkeyPatch) -> None:
    catalog_mod = importlib.import_module(
        "src.infrastructure.clients.search_catalog_client"
    )
    client = SearchCatalogClient()

    with monkeypatch.context() as m:
        m.setattr(
            catalog_mod.httpx,
            "get",
            lambda *_args, **_kwargs: (_ for _ in ()).throw(httpx.HTTPError("x")),
        )
        with pytest.raises(SearchCatalogError):
            client.fetch_rooms()

    bad = SimpleNamespace(status_code=500, text="down", json=lambda: {"detail": "bad"})
    monkeypatch.setattr(catalog_mod.httpx, "get", lambda *_args, **_kwargs: bad)
    with pytest.raises(SearchCatalogError, match="bad"):
        client.fetch_rooms()

    with monkeypatch.context() as m:
        m.setattr(
            catalog_mod.httpx,
            "post",
            lambda *_args, **_kwargs: (_ for _ in ()).throw(httpx.HTTPError("x")),
        )
        with pytest.raises(SearchCatalogError):
            client.create_room(property_id=1, room_type="std")

    bad_post = SimpleNamespace(
        status_code=422, text="unprocessable", json=lambda: {"detail": "invalid"}
    )
    monkeypatch.setattr(catalog_mod.httpx, "post", lambda *_args, **_kwargs: bad_post)
    with pytest.raises(SearchCatalogError, match="invalid"):
        client.create_room(property_id=1, room_type="std")

    no_room = SimpleNamespace(status_code=201, text="", json=lambda: {})
    monkeypatch.setattr(catalog_mod.httpx, "post", lambda *_args, **_kwargs: no_room)
    with pytest.raises(SearchCatalogError):
        client.create_room(property_id=1, room_type="std")
