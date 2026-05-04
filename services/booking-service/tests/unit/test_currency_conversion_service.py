from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from src.domain.services.currency_conversion_service import (
    CurrencyConversionError,
    CurrencyConversionService,
)
from src.infrastructure.repositories.fx_rate_repository import FxRateQuote


def _quote(base: str, quote: str, rate: float) -> FxRateQuote:
    return FxRateQuote(
        base_currency=base,
        quote_currency=quote,
        rate=rate,
        effective_at=datetime.now(timezone.utc),
        source="manual",
    )


def test_convert_amount_same_currency_returns_identity() -> None:
    repository = MagicMock()
    service = CurrencyConversionService(repository=repository)

    result = service.convert_amount(
        MagicMock(), amount=5000, source_currency="cop", target_currency="COP"
    )

    assert result.converted_amount == 5000
    assert result.rate_used == 1
    assert result.legs == []


def test_convert_amount_uses_direct_rate_when_available() -> None:
    repository = MagicMock()
    repository.get_latest_rate.side_effect = [_quote("COP", "USD", 0.00025)]
    service = CurrencyConversionService(repository=repository)

    result = service.convert_amount(
        MagicMock(), amount=4_000_000, source_currency="COP", target_currency="USD"
    )

    assert result.converted_amount == pytest.approx(1000)
    assert result.rate_used == pytest.approx(0.00025)
    assert len(result.legs) == 1


def test_convert_amount_uses_pivot_when_direct_rate_missing() -> None:
    repository = MagicMock()
    repository.get_latest_rate.side_effect = [
        None,
        _quote("ARS", "USD", 0.001),
        _quote("USD", "COP", 4000),
    ]
    service = CurrencyConversionService(repository=repository, pivot_currency="USD")

    result = service.convert_amount(
        MagicMock(), amount=100_000, source_currency="ARS", target_currency="COP"
    )

    assert result.converted_amount == pytest.approx(400_000)
    assert result.rate_used == pytest.approx(4)
    assert len(result.legs) == 2


def test_convert_amount_raises_when_no_direct_or_pivot_rates() -> None:
    repository = MagicMock()
    repository.get_latest_rate.side_effect = [None, None, None]
    service = CurrencyConversionService(repository=repository, pivot_currency="USD")

    with pytest.raises(CurrencyConversionError):
        service.convert_amount(
            MagicMock(), amount=100, source_currency="EUR", target_currency="COP"
        )
