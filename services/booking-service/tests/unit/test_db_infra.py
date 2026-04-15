from __future__ import annotations

from pathlib import Path
from sqlalchemy import create_engine, text

from src.infrastructure.database.connection import get_db
from src.infrastructure.database.migration_runner import _split_sql, run_migrations


def test_split_sql_ignores_empty_statements() -> None:
    sql = "CREATE TABLE a(id INT); ; \nINSERT INTO a VALUES (1);"
    parts = _split_sql(sql)
    assert len(parts) == 2
    assert parts[0].startswith("CREATE TABLE")


def test_run_migrations_applies_once(tmp_path: Path) -> None:
    migrations = tmp_path / "migrations"
    migrations.mkdir(parents=True, exist_ok=True)
    (migrations / "0001_init.sql").write_text(
        "CREATE TABLE test_table(id INTEGER PRIMARY KEY);",
        encoding="utf-8",
    )
    engine = create_engine("sqlite:///:memory:", future=True)

    run_migrations(engine, migrations)
    run_migrations(engine, migrations)  # second run should not fail or duplicate

    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT COUNT(*) FROM schema_migrations WHERE version='0001_init.sql'")
        ).scalar_one()
    assert row == 1


def test_get_db_yields_session_and_closes() -> None:
    gen = get_db()
    db = next(gen)
    assert db is not None
    try:
        next(gen)
    except StopIteration:
        pass
