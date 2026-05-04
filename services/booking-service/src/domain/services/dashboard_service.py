from __future__ import annotations

from datetime import date
from json import JSONDecodeError, loads

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.domain.schemas import BookingStatus, DashboardKpis
from src.infrastructure.database.models import Booking


class DashboardService:
    def get_kpis(
        self,
        db: Session,
        *,
        property_ids: list[int],
        date_from: date,
        date_to: date,
        today: date,
    ) -> DashboardKpis:
        if not property_ids:
            return DashboardKpis(
                total_reservations=0,
                active_reservations=0,
                current_guests=0,
                income_total=0.0,
            )

        total_reservations = int(
            db.execute(
                select(func.count())
                .select_from(Booking)
                .where(
                    Booking.property_id.in_(property_ids),
                    Booking.check_in >= date_from,
                    Booking.check_in <= date_to,
                )
            ).scalar_one()
            or 0
        )

        active_q = select(Booking).where(
            Booking.property_id.in_(property_ids),
            Booking.status == BookingStatus.CONFIRMED.value,
            Booking.check_in <= today,
            Booking.check_out > today,
        )
        active_rows = db.execute(active_q).scalars().all()
        active_reservations = len(active_rows)
        current_guests = sum(
            int(getattr(b, "guest_count", 0) or 0) for b in active_rows
        )

        income_rows = (
            db.execute(
                select(Booking.payment_summary_json).where(
                    Booking.property_id.in_(property_ids),
                    Booking.status == BookingStatus.CONFIRMED.value,
                    Booking.check_in >= date_from,
                    Booking.check_in <= date_to,
                    Booking.payment_summary_json.is_not(None),
                )
            )
            .scalars()
            .all()
        )
        income_total = 0.0
        for raw in income_rows:
            if not isinstance(raw, str) or not raw.strip():
                continue
            try:
                payload = loads(raw)
            except JSONDecodeError:
                continue
            income_total += float((payload or {}).get("total") or 0.0)

        return DashboardKpis(
            total_reservations=total_reservations,
            active_reservations=active_reservations,
            current_guests=current_guests,
            income_total=round(income_total, 2),
        )


dashboard_service = DashboardService()
