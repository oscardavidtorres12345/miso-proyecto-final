from __future__ import annotations

from datetime import date
from json import JSONDecodeError, loads

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.domain.schemas import (
    BookingStatus,
    DashboardKpis,
    DashboardOccupancyCategoryItem,
    DashboardPeriodPoint,
    DashboardRankingItem,
)
from src.infrastructure.clients import (
    PaymentClientError,
    PaymentTransportError,
    payment_client,
    SearchClientError,
    SearchTransportError,
    search_client,
)
from src.infrastructure.database.models import Booking


class DashboardService:
    ACTIVE_BOOKING_STATUSES = (
        BookingStatus.CONFIRMED.value,
        BookingStatus.CHECKED_IN.value,
    )

    @staticmethod
    def _period_key(value: date, granularity: str) -> str:
        if granularity == "day":
            return value.isoformat()
        if granularity == "week":
            iso = value.isocalendar()
            return f"{iso.year}-W{iso.week:02d}"
        return value.strftime("%Y-%m")

    def get_kpis(
        self,
        db: Session,
        *,
        property_ids: list[int],
        date_from: date,
        date_to: date,
        today: date,
        target_currency: str,
    ) -> tuple[DashboardKpis, list[str]]:
        warnings: list[str] = []
        if not property_ids:
            return (
                DashboardKpis(
                    total_reservations=0,
                    active_reservations=0,
                    current_guests=0,
                    income_total=0.0,
                ),
                warnings,
            )

        total_reservations = int(
            db.execute(
                select(func.count())
                .select_from(Booking)
                .where(
                    Booking.property_id.in_(property_ids),
                    Booking.status.in_(self.ACTIVE_BOOKING_STATUSES),
                    Booking.check_in >= date_from,
                    Booking.check_in <= date_to,
                )
            ).scalar_one()
            or 0
        )

        active_rows: list[Booking] = []
        if date_to >= today:
            effective_today = max(min(today, date_to), date_from)
            active_q = select(Booking).where(
                Booking.property_id.in_(property_ids),
                Booking.status.in_(self.ACTIVE_BOOKING_STATUSES),
                Booking.check_in >= date_from,
                Booking.check_in <= effective_today,
                Booking.check_out > effective_today,
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
                    Booking.status.in_(self.ACTIVE_BOOKING_STATUSES),
                    Booking.check_in >= date_from,
                    Booking.check_in <= date_to,
                    Booking.payment_summary_json.is_not(None),
                )
            )
            .scalars()
            .all()
        )
        income_total = 0.0
        normalized_target = (target_currency or "COP").strip().upper()
        for raw in income_rows:
            if not isinstance(raw, str) or not raw.strip():
                continue
            try:
                payload = loads(raw)
            except JSONDecodeError:
                continue
            source_amount = float((payload or {}).get("total") or 0.0)
            source_currency = str((payload or {}).get("currency") or "COP").upper()
            if source_amount <= 0:
                continue
            if source_currency == normalized_target:
                income_total += source_amount
                continue
            try:
                quote = payment_client.fx_quote(
                    from_currency=source_currency,
                    to_currency=normalized_target,
                    amount=source_amount,
                )
                income_total += float(quote.get("converted_amount") or 0.0)
            except (PaymentClientError, PaymentTransportError):
                warnings.append(
                    f"Failed to convert income from {source_currency} to {normalized_target}."
                )

        return (
            DashboardKpis(
                total_reservations=total_reservations,
                active_reservations=active_reservations,
                current_guests=current_guests,
                income_total=round(income_total, 2),
            ),
            warnings,
        )

    def get_time_series(
        self,
        db: Session,
        *,
        property_ids: list[int],
        date_from: date,
        date_to: date,
        granularity: str,
        target_currency: str,
    ) -> tuple[list[DashboardPeriodPoint], list[DashboardPeriodPoint], list[str]]:
        if not property_ids:
            return [], [], []

        warnings: list[str] = []
        bookings_by_period: dict[str, float] = {}
        income_trend: dict[str, float] = {}
        normalized_target = (target_currency or "COP").strip().upper()

        rows = (
            db.execute(
                select(Booking).where(
                    Booking.property_id.in_(property_ids),
                    Booking.status.in_(self.ACTIVE_BOOKING_STATUSES),
                    Booking.check_in >= date_from,
                    Booking.check_in <= date_to,
                )
            )
            .scalars()
            .all()
        )
        for row in rows:
            key = self._period_key(row.check_in, granularity)
            bookings_by_period[key] = bookings_by_period.get(key, 0.0) + 1.0

            raw = getattr(row, "payment_summary_json", None)
            if not isinstance(raw, str) or not raw.strip():
                continue
            try:
                payload = loads(raw)
            except JSONDecodeError:
                continue
            source_amount = float((payload or {}).get("total") or 0.0)
            source_currency = str((payload or {}).get("currency") or "COP").upper()
            if source_amount <= 0:
                continue
            converted_amount = source_amount
            if source_currency != normalized_target:
                try:
                    quote = payment_client.fx_quote(
                        from_currency=source_currency,
                        to_currency=normalized_target,
                        amount=source_amount,
                    )
                    converted_amount = float(quote.get("converted_amount") or 0.0)
                except (PaymentClientError, PaymentTransportError):
                    warnings.append(
                        f"Failed to convert income from {source_currency} to {normalized_target}."
                    )
                    continue
            income_trend[key] = income_trend.get(key, 0.0) + converted_amount

        bookings_points = [
            DashboardPeriodPoint(period=k, value=v)
            for k, v in sorted(bookings_by_period.items())
        ]
        income_points = [
            DashboardPeriodPoint(period=k, value=round(v, 2))
            for k, v in sorted(income_trend.items())
        ]
        return bookings_points, income_points, warnings

    def get_occupancy_and_ranking(
        self,
        db: Session,
        *,
        property_ids: list[int],
        date_from: date,
        date_to: date,
        top_n: int,
    ) -> tuple[
        list[DashboardOccupancyCategoryItem], list[DashboardRankingItem], list[str]
    ]:
        if not property_ids:
            return [], [], []
        warnings: list[str] = []

        rows = (
            db.execute(
                select(Booking).where(
                    Booking.property_id.in_(property_ids),
                    Booking.status.in_(self.ACTIVE_BOOKING_STATUSES),
                    Booking.check_in >= date_from,
                    Booking.check_in <= date_to,
                )
            )
            .scalars()
            .all()
        )

        counts: dict[tuple[str, str, str | None], int] = {}
        for row in rows:
            room_label = getattr(row, "room_type", None)
            if not isinstance(room_label, str) or not room_label.strip():
                room_label = f"Room {int(getattr(row, 'room_id', 0) or 0)}"
            room_label = room_label.strip()

            property_label = getattr(row, "property_name", None)
            if not isinstance(property_label, str) or not property_label.strip():
                property_id = int(getattr(row, "property_id", 0) or 0)
                property_label = (
                    f"Property {property_id}" if property_id > 0 else "Property N/A"
                )
            property_label = property_label.strip()

            key = (property_label, room_label, room_label)
            counts[key] = counts.get(key, 0) + 1

        sorted_items = sorted(
            counts.items(), key=lambda it: (-it[1], it[0][1], it[0][0])
        )
        occupancy = [
            DashboardOccupancyCategoryItem(
                category=label,
                property_name=property_name,
                room_type=room_type if not room_type.startswith("Room ") else None,
                value=value,
            )
            for (property_name, label, room_type), value in sorted_items
        ]
        amenity_counts: dict[str, int] = {}
        amenities_by_property: dict[int, list[str]] = {}
        for row in rows:
            property_id = int(getattr(row, "property_id", 0) or 0)
            if property_id <= 0:
                continue
            if property_id not in amenities_by_property:
                try:
                    detail = search_client.get_hotel_detail(
                        property_id=property_id,
                        check_in=row.check_in.isoformat(),
                        check_out=row.check_out.isoformat(),
                        adults=max(int(getattr(row, "guest_count", 1) or 1), 1),
                    )
                    raw = (
                        detail.get("amenities", []) if isinstance(detail, dict) else []
                    )
                    amenities_by_property[property_id] = [
                        str(item.get("id")).strip()
                        for item in raw
                        if isinstance(item, dict)
                        and isinstance(item.get("id"), str)
                        and item.get("id").strip()
                    ]
                except (SearchClientError, SearchTransportError):
                    warnings.append(
                        f"Failed to fetch amenities for property {property_id}."
                    )
                    amenities_by_property[property_id] = []
            for amenity in amenities_by_property.get(property_id, []):
                amenity_counts[amenity] = amenity_counts.get(amenity, 0) + 1

        ranking = [
            DashboardRankingItem(
                label=amenity,
                value=value,
            )
            for amenity, value in sorted(
                amenity_counts.items(), key=lambda it: (-it[1], it[0])
            )[: max(top_n, 1)]
        ]
        return occupancy, ranking, warnings


dashboard_service = DashboardService()
