from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.infrastructure.database.models import FxRate


@dataclass(frozen=True)
class FxRateQuote:
    base_currency: str
    quote_currency: str
    rate: float
    effective_at: datetime
    source: str


class FxRateRepository:
    def get_latest_rate(
        self,
        db: Session,
        *,
        base_currency: str,
        quote_currency: str,
    ) -> FxRateQuote | None:
        base = base_currency.upper()
        quote = quote_currency.upper()

        stmt = (
            select(FxRate)
            .where(
                FxRate.base_currency == base,
                FxRate.quote_currency == quote,
            )
            .order_by(FxRate.effective_at.desc())
            .limit(1)
        )
        entry = db.execute(stmt).scalars().first()
        if entry is None:
            return None

        return FxRateQuote(
            base_currency=entry.base_currency,
            quote_currency=entry.quote_currency,
            rate=float(entry.rate),
            effective_at=entry.effective_at,
            source=entry.source,
        )


fx_rate_repository = FxRateRepository()
