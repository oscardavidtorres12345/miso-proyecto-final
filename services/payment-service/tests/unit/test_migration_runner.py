from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine, text

from src.infrastructure.database.migration_runner import _split_sql, run_migrations


def test_split_sql_skips_empty_statements() -> None:
    sql = "SELECT 1;  ;\nINSERT INTO t VALUES (1);"
    assert _split_sql(sql) == ["SELECT 1;  ;", "INSERT INTO t VALUES (1);"]


def test_run_migrations_applies_new_files(tmp_path: Path) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    migrations_dir = tmp_path / "migrations"
    migrations_dir.mkdir(parents=True, exist_ok=True)

    (migrations_dir / "0001_init.sql").write_text(
        "CREATE TABLE demo (id INTEGER PRIMARY KEY);\nINSERT INTO demo(id) VALUES (1);",
        encoding="utf-8",
    )

    run_migrations(engine, migrations_dir)
    # Re-run to cover already-applied branch
    run_migrations(engine, migrations_dir)

    with engine.begin() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM demo")).scalar_one()
        applied = conn.execute(
            text("SELECT COUNT(*) FROM schema_migrations")
        ).scalar_one()

    assert count == 1
    assert applied == 1
