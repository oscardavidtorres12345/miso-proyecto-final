"""
DB initialization: creates the PostgreSQL database (if absent) and all tables.

Two-step process called once on startup:
  1. _ensure_database_exists() — connects to the 'postgres' system DB and issues
     CREATE DATABASE if the target DB does not exist. Idempotent.
  2. Base.metadata.create_all() — creates tables inside the target DB. Idempotent.
"""
from __future__ import annotations

import logging
from urllib.parse import urlparse, urlunparse

from sqlalchemy import create_engine, text

from src.infrastructure.database.session import Base, engine
import src.infrastructure.database.models  # noqa: F401 — registers ORM models

logger = logging.getLogger(__name__)


def _ensure_database_exists(database_url: str) -> None:
    """Creates the target database if it does not exist. AUTOCOMMIT required."""
    parsed = urlparse(database_url)
    db_name = parsed.path.lstrip("/")
    admin_url = urlunparse(parsed._replace(path="/postgres"))

    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db"), {"db": db_name}
            )
            if result.scalar() is None:
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info("currency-service: database '%s' created.", db_name)
            else:
                logger.info("currency-service: database '%s' already exists.", db_name)
    finally:
        admin_engine.dispose()


def init_db() -> None:
    """Called once on startup. Creates DB + tables, fully idempotent."""
    _ensure_database_exists(str(engine.url))
    with engine.begin() as conn:
        Base.metadata.create_all(conn)
    logger.info("currency-service: schema ready.")
