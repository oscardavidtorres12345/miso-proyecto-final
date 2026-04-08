"""
ExchangeRateRepository — persistence layer for exchange_rate_snapshot.

Operations:
  - upsert: insert or update the snapshot for a given date (idempotent)
  - get_by_date: fetch snapshot for a specific date
  - get_latest: fetch the most recent snapshot available
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from src.infrastructure.database.models import ExchangeRateSnapshot


class ExchangeRateRepository:
    def __init__(self, session: Session):
        self.session = session

    def upsert(self, snapshot_date: date, source: str, quotes: dict) -> ExchangeRateSnapshot:
        """Insert or update the snapshot for the given date. Idempotent."""
        existing = self.get_by_date(snapshot_date)
        if existing:
            existing.source = source
            existing.quotes = quotes
            self.session.commit()
            self.session.refresh(existing)
            return existing
        snapshot = ExchangeRateSnapshot(date=snapshot_date, source=source, quotes=quotes)
        self.session.add(snapshot)
        self.session.commit()
        self.session.refresh(snapshot)
        return snapshot

    def get_by_date(self, snapshot_date: date) -> Optional[ExchangeRateSnapshot]:
        """Return the snapshot for a specific date, or None if not found."""
        return self.session.execute(
            select(ExchangeRateSnapshot).where(ExchangeRateSnapshot.date == snapshot_date)
        ).scalars().first()

    def get_latest(self) -> Optional[ExchangeRateSnapshot]:
        """Return the most recent snapshot available."""
        return self.session.execute(
            select(ExchangeRateSnapshot).order_by(desc(ExchangeRateSnapshot.date)).limit(1)
        ).scalars().first()
