"""
fetch_rates.py — K8s CronJob entry point

Corre una vez al día como Kubernetes CronJob (schedule: "0 6 * * *").
Obtiene las tasas históricas de ayer desde APILayer y las guarda en la DB.

Uso local:
    python -m src.jobs.fetch_rates
    python -m src.jobs.fetch_rates --date 2026-04-07   # backfill de una fecha
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import date, timedelta

from src.infrastructure.database.db_init import init_db
from src.infrastructure.database.session import SessionLocal
from src.domain.services.exchange_rate_service import ExchangeRateService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


def parse_args() -> date:
    parser = argparse.ArgumentParser(description="Fetch exchange rates from APILayer")
    parser.add_argument(
        "--date",
        type=date.fromisoformat,
        default=date.today() - timedelta(days=1),
        help="Target date in YYYY-MM-DD format (default: yesterday)",
    )
    return parser.parse_args().date


def main() -> None:
    target_date = parse_args()
    logger.info("=== currency-service fetch job starting — target date: %s ===", target_date)

    # Garantiza que la DB y las tablas existen antes de escribir
    init_db()

    db = SessionLocal()
    try:
        service = ExchangeRateService(db)
        snapshot = service.fetch_and_store(target_date)
        logger.info(
            "=== Done — snapshot id=%s date=%s pairs=%d ===",
            snapshot.id, snapshot.date, len(snapshot.quotes),
        )
    except Exception as exc:
        logger.error("=== Job failed: %s ===", exc)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
