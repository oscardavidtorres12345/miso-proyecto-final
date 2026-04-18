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

            sql = migration_file.read_text(encoding="utf-8")
            for stmt in _split_sql(sql):
                conn.execute(text(stmt))

            conn.execute(
                text("INSERT INTO schema_migrations(version) VALUES (:version)"),
                {"version": version},
            )


def _split_sql(sql: str) -> list[str]:
    """Split SQL file into individual statements, handling comments."""
    statements = []
    current = []
    for line in sql.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        current.append(line)
        if stripped.endswith(";"):
            statements.append("\n".join(current))
            current = []
    if current:
        statements.append("\n".join(current))
    return [s.strip() for s in statements if s.strip()]
