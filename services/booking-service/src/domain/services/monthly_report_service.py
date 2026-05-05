from __future__ import annotations

from datetime import date
from json import JSONDecodeError, loads

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.domain.schemas import (
    BookingStatus,
    MonthlyReportAdditionalChart,
    MonthlyReportBarPoint,
    MonthlyReportDistributionItem,
    MonthlyReportKpis,
)
from src.infrastructure.database.models import Booking


class MonthlyReportService:
    def build_report(
        self,
        db: Session,
        *,
        property_ids: list[int],
        period_start: date,
        period_end: date,
        top_n: int,
    ) -> tuple[
        MonthlyReportKpis,
        list[MonthlyReportDistributionItem],
        list[MonthlyReportBarPoint],
        list[MonthlyReportAdditionalChart],
    ]:
        if not property_ids:
            return (
                MonthlyReportKpis(
                    total_reservations=0,
                    cancelled_reservations=0,
                    new_guests=0,
                    returning_guests=0,
                    occupied_rooms=0,
                    available_rooms=0,
                    gross_income=0.0,
                    net_income=0.0,
                ),
                [],
                [],
                [],
            )

        rows = (
            db.execute(
                select(Booking).where(
                    Booking.property_id.in_(property_ids),
                    Booking.check_in >= period_start,
                    Booking.check_in <= period_end,
                )
            )
            .scalars()
            .all()
        )

        total_reservations = len(rows)
        cancelled_reservations = sum(
            1 for row in rows if row.status == BookingStatus.CANCELLED.value
        )
        confirmed_rows = [
            row for row in rows if row.status == BookingStatus.CONFIRMED.value
        ]

        guest_seen: dict[str, int] = {}
        for row in confirmed_rows:
            key = str(row.user_id)
            guest_seen[key] = guest_seen.get(key, 0) + 1
        new_guests = sum(1 for _, count in guest_seen.items() if count == 1)
        returning_guests = sum(1 for _, count in guest_seen.items() if count > 1)

        occupied_rooms = len(
            {f"{row.property_id}:{row.room_id}" for row in confirmed_rows}
        )
        available_rooms = 0

        gross_income = 0.0
        for row in confirmed_rows:
            raw = getattr(row, "payment_summary_json", None)
            if not isinstance(raw, str) or not raw.strip():
                continue
            try:
                payload = loads(raw)
            except JSONDecodeError:
                continue
            gross_income += float((payload or {}).get("total") or 0.0)
        net_income = round(gross_income, 2)
        gross_income = round(gross_income, 2)

        distribution_counts: dict[str, int] = {}
        bars_by_day: dict[str, float] = {}
        for row in confirmed_rows:
            label = (getattr(row, "room_type", None) or f"Room {row.room_id}").strip()
            distribution_counts[label] = distribution_counts.get(label, 0) + 1
            period = row.check_in.isoformat()
            bars_by_day[period] = bars_by_day.get(period, 0.0) + 1.0

        total_distribution = sum(distribution_counts.values()) or 1
        distribution_sorted = sorted(
            distribution_counts.items(), key=lambda it: (-it[1], it[0])
        )[: max(1, top_n)]
        distribution = [
            MonthlyReportDistributionItem(
                category=label,
                room_type=label if not label.startswith("Room ") else None,
                value=float(count),
                percentage=round((count / total_distribution) * 100, 2),
            )
            for label, count in distribution_sorted
        ]

        bars_by_period = [
            MonthlyReportBarPoint(period=key, value=value)
            for key, value in sorted(bars_by_day.items())
        ]

        cumulative = 0.0
        cumulative_points: list[MonthlyReportBarPoint] = []
        for point in bars_by_period:
            cumulative += point.value
            cumulative_points.append(
                MonthlyReportBarPoint(period=point.period, value=round(cumulative, 2))
            )
        occupancy_points = [
            MonthlyReportBarPoint(period=item.category, value=item.value)
            for item in distribution
        ]
        additional = [
            MonthlyReportAdditionalChart(
                key="occupancy_by_room_type",
                title="Ocupacion por tipo de habitacion",
                points=occupancy_points,
            ),
            MonthlyReportAdditionalChart(
                key="accumulated_income",
                title="Ingresos acumulados",
                points=cumulative_points,
            ),
        ]

        return (
            MonthlyReportKpis(
                total_reservations=total_reservations,
                cancelled_reservations=cancelled_reservations,
                new_guests=new_guests,
                returning_guests=returning_guests,
                occupied_rooms=occupied_rooms,
                available_rooms=available_rooms,
                gross_income=gross_income,
                net_income=net_income,
            ),
            distribution,
            bars_by_period,
            additional,
        )


monthly_report_service = MonthlyReportService()
