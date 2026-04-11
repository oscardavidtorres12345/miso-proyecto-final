import os
from collections.abc import Generator
from urllib.parse import urlparse

import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# No default — crash immediately if DATABASE_URL is not set.
DATABASE_URL: str = os.environ["DATABASE_URL"]


def _ensure_db_exists(url: str) -> None:
    """Create the target database in PostgreSQL if it does not exist."""
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

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
