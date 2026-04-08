"""
ExchangeRateService — business logic for the currency-service.

Responsibilities:
  1. fetch_and_store(): called by the cron job (daily at 06:00).
     - Calls APILayer /historical with date = yesterday and source = USD.
     - Persists (upserts) the snapshot into the DB.
  2. get_latest(): returns the most recent snapshot from DB.
  3. get_by_date(): returns the snapshot for a specific date from DB.
"""
from __future__ import annotations

import logging
import os
from datetime import date, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from src.infrastructure.repositories.exchange_rate_repository import ExchangeRateRepository
from src.infrastructure.database.models import ExchangeRateSnapshot

logger = logging.getLogger(__name__)

APILAYER_API_KEY = os.getenv("APILAYER_API_KEY", "")
APILAYER_BASE_URL = "https://api.apilayer.com/currency_data"
SOURCE_CURRENCY = "USD"


class ExchangeRateService:
    def __init__(self, session: Session):
        self.repo = ExchangeRateRepository(session)

    def fetch_and_store(self, target_date: Optional[date] = None) -> ExchangeRateSnapshot:
        """
        Fetches historical rates for target_date (defaults to yesterday) from APILayer
        and upserts into the DB. Called by the K8s CronJob script and POST /rates/fetch.
        """
        if target_date is None:
            target_date = date.today() - timedelta(days=1)

        date_str = target_date.strftime("%Y-%m-%d")
        logger.info("Fetching exchange rates for %s from APILayer...", date_str)

        response = httpx.get(
            f"{APILAYER_BASE_URL}/historical",
            params={"date": date_str, "source": SOURCE_CURRENCY},
            headers={"apikey": APILAYER_API_KEY},
            timeout=30.0,
        )
        response.raise_for_status()
        payload = response.json()

        if not payload.get("success", False):
            raise ValueError(f"APILayer returned error: {payload}")

        quotes: dict = payload.get("quotes", {})
        logger.info("Fetched %d currency pairs for %s.", len(quotes), date_str)

        snapshot = self.repo.upsert(
            snapshot_date=target_date,
            source=SOURCE_CURRENCY,
            quotes=quotes,
        )
        logger.info("Snapshot saved: id=%s, date=%s", snapshot.id, snapshot.date)
        return snapshot

    def get_latest(self) -> Optional[ExchangeRateSnapshot]:
        """Returns the most recent snapshot available in the DB."""
        return self.repo.get_latest()

    def get_by_date(self, snapshot_date: date) -> Optional[ExchangeRateSnapshot]:
        """Returns the snapshot for a specific date, or None if not found."""
        return self.repo.get_by_date(snapshot_date)
