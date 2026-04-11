import asyncio
import os
from urllib.parse import urlparse

import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# No default — crash immediately if DATABASE_URL is not set.
DATABASE_URL: str = os.environ["DATABASE_URL"]

# Read replica — falls back to primary when not configured (PF-281)
READ_REPLICA_URL = os.getenv("READ_REPLICA_URL", DATABASE_URL)


def _ensure_db_exists_sync(url: str) -> None:
    """Create the target database in PostgreSQL if it does not exist.

    Uses asyncpg directly (run via asyncio.run) so it works at module
    import time before the async event loop is started by FastAPI/uvicorn.
    """
    async def _create() -> None:
        parsed = urlparse(url)
        dbname = parsed.path.lstrip("/")
        conn = await asyncpg.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database="postgres",
            user=parsed.username,
            password=parsed.password,
        )
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", dbname
        )
        if not exists:
            await conn.execute(f"CREATE DATABASE {dbname}")  # noqa: S608
        await conn.close()

    asyncio.run(_create())


_ensure_db_exists_sync(DATABASE_URL)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

replica_engine = create_async_engine(
    READ_REPLICA_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,       # More connections for read-heavy traffic
    max_overflow=40,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

AsyncReadSessionLocal = async_sessionmaker(
    bind=replica_engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Primary DB session (writes)."""
    async with AsyncSessionLocal() as session:
        yield session


async def get_read_db() -> AsyncSession:
    """Read-replica session (SELECT queries). Falls back to primary if no replica configured."""
    async with AsyncReadSessionLocal() as session:
        yield session

