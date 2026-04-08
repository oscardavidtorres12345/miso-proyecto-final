"""
Unit tests for ExchangeRateService.
All external dependencies (DB session, httpx, APILayer) are mocked.
No real infrastructure required. Sync — no pytest-asyncio needed.
"""
import pytest
from datetime import date, timedelta
from unittest.mock import MagicMock, patch

from src.domain.services.exchange_rate_service import ExchangeRateService

TODAY = date.today()
YESTERDAY = TODAY - timedelta(days=1)

FAKE_QUOTES = {"USDCOP": 4180.5, "USDARS": 1040.2, "USDEUR": 0.92}


def _make_snapshot(snapshot_date: date = YESTERDAY) -> MagicMock:
    snap = MagicMock()
    snap.id = 1
    snap.date = snapshot_date
    snap.source = "USD"
    snap.quotes = FAKE_QUOTES
    return snap


# ---------------------------------------------------------------------------
# get_latest
# ---------------------------------------------------------------------------

def test_get_latest_returns_none_when_empty():
    with patch("src.domain.services.exchange_rate_service.ExchangeRateRepository") as MockRepo:
        MockRepo.return_value.get_latest.return_value = None
        result = ExchangeRateService(MagicMock()).get_latest()
    assert result is None


def test_get_latest_returns_most_recent_snapshot():
    expected = _make_snapshot()
    with patch("src.domain.services.exchange_rate_service.ExchangeRateRepository") as MockRepo:
        MockRepo.return_value.get_latest.return_value = expected
        result = ExchangeRateService(MagicMock()).get_latest()
    assert result is expected
    assert result.date == YESTERDAY


# ---------------------------------------------------------------------------
# get_by_date
# ---------------------------------------------------------------------------

def test_get_by_date_returns_none_for_unknown_date():
    with patch("src.domain.services.exchange_rate_service.ExchangeRateRepository") as MockRepo:
        MockRepo.return_value.get_by_date.return_value = None
        result = ExchangeRateService(MagicMock()).get_by_date(date(2020, 1, 1))
    assert result is None


def test_get_by_date_returns_correct_snapshot():
    target = date(2026, 3, 15)
    expected = _make_snapshot(target)
    with patch("src.domain.services.exchange_rate_service.ExchangeRateRepository") as MockRepo:
        MockRepo.return_value.get_by_date.return_value = expected
        result = ExchangeRateService(MagicMock()).get_by_date(target)
    assert result.date == target
    MockRepo.return_value.get_by_date.assert_called_once_with(target)


# ---------------------------------------------------------------------------
# fetch_and_store
# ---------------------------------------------------------------------------

def test_fetch_and_store_uses_yesterday_by_default():
    expected = _make_snapshot(YESTERDAY)
    fake_response = MagicMock()
    fake_response.json.return_value = {"success": True, "quotes": FAKE_QUOTES}

    with patch("src.domain.services.exchange_rate_service.ExchangeRateRepository") as MockRepo, \
         patch("src.domain.services.exchange_rate_service.httpx.get", return_value=fake_response):
        MockRepo.return_value.upsert.return_value = expected
        result = ExchangeRateService(MagicMock()).fetch_and_store()

    assert result.date == YESTERDAY
    call_kwargs = MockRepo.return_value.upsert.call_args.kwargs
    assert call_kwargs["snapshot_date"] == YESTERDAY
    assert call_kwargs["source"] == "USD"
    assert call_kwargs["quotes"] == FAKE_QUOTES


def test_fetch_and_store_raises_on_api_error():
    fake_response = MagicMock()
    fake_response.json.return_value = {"success": False, "error": {"info": "Invalid API key."}}

    with patch("src.domain.services.exchange_rate_service.ExchangeRateRepository"), \
         patch("src.domain.services.exchange_rate_service.httpx.get", return_value=fake_response):
        with pytest.raises(ValueError, match="APILayer returned error"):
            ExchangeRateService(MagicMock()).fetch_and_store()
