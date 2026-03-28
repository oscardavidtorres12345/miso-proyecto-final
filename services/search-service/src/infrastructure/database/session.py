import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# Primary (read-write) database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://travelhub:travelhub@localhost:5432/search_db",
)

# Read replica — falls back to primary when not configured (PF-281)
READ_REPLICA_URL = os.getenv("READ_REPLICA_URL", DATABASE_URL)

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

