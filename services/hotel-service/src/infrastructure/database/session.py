"""
Conexión a DB CATALOG A — la misma base de datos que usa el search-service.
El hotel-service la usa en modo lectura para HU004 (detalle de hospedaje).
"""
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://travelhub:travelhub@localhost:5432/search_db",
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Sesión de lectura para detalle de hospedaje."""
    async with AsyncSessionLocal() as session:
        yield session
