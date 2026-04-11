import os
from pathlib import Path
from urllib.parse import urlparse

import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from src.infrastructure.database.migration_runner import run_migrations

# No default — crash immediately if DATABASE_URL is not set.
# SQLite is not supported in this service.
DATABASE_URL: str = os.environ["DATABASE_URL"]


def _ensure_db_exists(url: str) -> None:
    """Create the target database in PostgreSQL if it does not exist.

    Connects to the default 'postgres' DB on the same RDS host and runs
    CREATE DATABASE. Safe to call multiple times (idempotent).
    """
    parsed = urlparse(url)
    dbname = parsed.path.lstrip("/")
    conn = psycopg.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        dbname="postgres",
        user=parsed.username,
        password=parsed.password,
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,))
    if not cur.fetchone():
        cur.execute(f"CREATE DATABASE {dbname}")  # noqa: S608
    conn.close()


_ensure_db_exists(DATABASE_URL)

engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    migrations_dir = Path(__file__).resolve().parent / "migrations"
    run_migrations(engine, migrations_dir)
