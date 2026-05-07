from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy import Engine, text


def run_migrations(engine: Engine, migrations_dir: Path) -> None:
    migrations_dir.mkdir(parents=True, exist_ok=True)

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(255) PRIMARY KEY,
                    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

        applied = {
            row[0]
            for row in conn.execute(
                text("SELECT version FROM schema_migrations")
            ).fetchall()
        }

        for migration_file in sorted(migrations_dir.glob("*.sql")):
            version = migration_file.name
            if version in applied:
                continue

            # SQLite test runs do not support PostgreSQL sequence DDL.
            if (
                engine.dialect.name == "sqlite"
                and version in {
                    "0004_fix_booking_batch_item_id_sequence.sql",
                    "0011_seed_historical_bookings.sql",
                }
            ):
                conn.execute(
                    text("INSERT INTO schema_migrations(version) VALUES (:version)"),
                    {"version": version},
                )
                continue

            sql = migration_file.read_text(encoding="utf-8")
            for stmt in _split_sql(sql):
                if engine.dialect.name == "sqlite":
                    stmt = _normalize_sqlite_stmt(stmt)
                conn.execute(text(stmt))

            conn.execute(
                text("INSERT INTO schema_migrations(version) VALUES (:version)"),
                {"version": version},
            )


def _split_sql(sql: str) -> list[str]:
    statements = []
    for raw in sql.split(";"):
        stmt = raw.strip()
        if stmt:
            statements.append(stmt)
    return statements


def _normalize_sqlite_stmt(stmt: str) -> str:
    # SQLite does not support:
    # - ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
    normalized = re.sub(
        r"\bADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\b",
        "ADD COLUMN",
        stmt,
        flags=re.IGNORECASE,
    )
    return normalized
