from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from src.infrastructure.repositories.fx_rate_repository import (
    FxRateQuote,
    FxRateRepository,
    fx_rate_repository,
)


class CurrencyConversionError(Exception):
    pass


@dataclass(frozen=True)
class ConversionResult:
    source_currency: str
    target_currency: str
    source_amount: float
    converted_amount: float
    rate_used: float
    legs: list[FxRateQuote]


class CurrencyConversionService:
    def __init__(
        self,
        repository: FxRateRepository = fx_rate_repository,
        pivot_currency: str = "USD",
    ) -> None:
        self._repository = repository
        self._pivot_currency = pivot_currency.upper()

    def convert_amount(
        self,
        db: Session,
        *,
        amount: float,
        source_currency: str,
        target_currency: str,
    ) -> ConversionResult:
        source = source_currency.upper()
        target = target_currency.upper()

        if amount < 0:
            raise CurrencyConversionError("Amount must be non-negative.")
        if source == target:
            return ConversionResult(
                source_currency=source,
                target_currency=target,
                source_amount=amount,
                converted_amount=amount,
                rate_used=1.0,
                legs=[],
            )

        direct = self._repository.get_latest_rate(
            db, base_currency=source, quote_currency=target
        )
        if direct is not None:
            return ConversionResult(
                source_currency=source,
                target_currency=target,
                source_amount=amount,
                converted_amount=amount * direct.rate,
                rate_used=direct.rate,
                legs=[direct],
            )

        leg1 = self._repository.get_latest_rate(
            db, base_currency=source, quote_currency=self._pivot_currency
        )
        leg2 = self._repository.get_latest_rate(
            db, base_currency=self._pivot_currency, quote_currency=target
        )
        if leg1 is None or leg2 is None:
            raise CurrencyConversionError(
                f"Missing FX rate for conversion {source}->{target}."
            )

        composed_rate = leg1.rate * leg2.rate
        return ConversionResult(
            source_currency=source,
            target_currency=target,
            source_amount=amount,
            converted_amount=amount * composed_rate,
            rate_used=composed_rate,
            legs=[leg1, leg2],
        )


currency_conversion_service = CurrencyConversionService()
