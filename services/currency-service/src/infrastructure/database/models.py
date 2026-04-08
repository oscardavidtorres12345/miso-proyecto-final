"""
ORM model for exchange_rate_snapshot table.

Schema:
  - id         : serial primary key
  - date        : date (UNIQUE) — the historical date of the rates (yesterday)
  - source      : varchar(10)  — always "USD" (APILayer free plan base currency)
  - quotes      : JSONB        — raw JSON from APILayer /historical endpoint
  - created_at  : timestamptz  — audit: when the row was inserted
  - updated_at  : timestamptz  — audit: last update (idempotent upsert)
"""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import DateTime, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.session import Base  # noqa: F401 — registers Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ExchangeRateSnapshot(Base):
    __tablename__ = "exchange_rate_snapshot"
    __table_args__ = (UniqueConstraint("date", name="uq_exchange_rate_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")
    quotes: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )
