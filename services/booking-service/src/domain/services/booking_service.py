from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.domain.schemas import BookingStatus, BookingSummary
from src.infrastructure.database.models import Booking, BookingBatch, BookingBatchItem


class BookingNotFoundError(Exception):
    pass


class BookingConflictError(Exception):
    pass


class BookingValidationError(Exception):
    pass


class BookingService:
    def create_on_hold(
        self,
        db: Session,
        *,
        hold_id: str,
        room_id: int,
        property_id: int,
        user_id: str,
        check_in: date,
        check_out: date,
        units: int,
        guest_count: int,
        expires_at: datetime | None,
        payment_summary_json: str | None,
    ) -> Booking:
        entry = Booking(
            booking_id=str(uuid4()),
            hold_id=hold_id,
            room_id=room_id,
            property_id=property_id,
            user_id=user_id,
            check_in=check_in,
            check_out=check_out,
            units=units,
            guest_count=guest_count,
            status=BookingStatus.ON_HOLD.value,
            payment_summary_json=payment_summary_json,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            updated_at=None,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    def get(self, db: Session, booking_id: str) -> Booking:
        entry = db.get(Booking, booking_id)
        if entry is None:
            raise BookingNotFoundError("Booking not found.")
        return entry

    def mark_confirmed(self, db: Session, booking_id: str) -> Booking:
        entry = self.get(db, booking_id)
        if entry.status == BookingStatus.CONFIRMED.value:
            raise BookingConflictError("Booking already confirmed.")
        if entry.status in (BookingStatus.CANCELLED.value, BookingStatus.EXPIRED.value):
            raise BookingConflictError("Booking is not confirmable.")

        entry.status = BookingStatus.CONFIRMED.value
        entry.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(entry)
        return entry

    def mark_expired(self, db: Session, booking_id: str) -> Booking:
        entry = self.get(db, booking_id)
        entry.status = BookingStatus.EXPIRED.value
        entry.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(entry)
        return entry

    def mark_cancelled(self, db: Session, booking_id: str) -> Booking:
        entry = self.get(db, booking_id)
        if entry.status == BookingStatus.CANCELLED.value:
            raise BookingConflictError("Booking already cancelled.")
        if entry.status == BookingStatus.CONFIRMED.value:
            raise BookingConflictError("Confirmed booking cannot be cancelled.")
        if entry.status == BookingStatus.EXPIRED.value:
            raise BookingConflictError("Expired booking cannot be cancelled.")

        entry.status = BookingStatus.CANCELLED.value
        entry.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(entry)
        return entry

    def list_by_user(self, db: Session, user_id: str) -> list[BookingSummary]:
        stmt = (
            select(Booking)
            .where(Booking.user_id == user_id)
            .order_by(Booking.created_at.desc())
        )
        bookings = db.execute(stmt).scalars().all()

        return [
            BookingSummary(
                booking_id=b.booking_id,
                hold_id=b.hold_id,
                property_id=getattr(b, "property_id", None),
                room_id=b.room_id,
                user_id=b.user_id,
                check_in=b.check_in,
                check_out=b.check_out,
                units=b.units,
                guest_count=getattr(b, "guest_count", 1),
                status=BookingStatus(b.status),
                expires_at=b.expires_at,
            )
            for b in bookings
        ]

    def list_by_properties(
        self,
        db: Session,
        *,
        property_ids: list[int],
    ) -> list[BookingSummary]:
        if not property_ids:
            return []

        stmt = (
            select(Booking)
            .where(Booking.property_id.in_(property_ids))
            .order_by(Booking.check_in.asc(), Booking.created_at.asc())
        )
        bookings = db.execute(stmt).scalars().all()

        return [
            BookingSummary(
                booking_id=b.booking_id,
                hold_id=b.hold_id,
                property_id=getattr(b, "property_id", None),
                room_id=b.room_id,
                user_id=b.user_id,
                check_in=b.check_in,
                check_out=b.check_out,
                units=b.units,
                guest_count=getattr(b, "guest_count", 1),
                status=BookingStatus(b.status),
                expires_at=b.expires_at,
            )
            for b in bookings
        ]

    def create_batch(
        self, db: Session, *, user_id: str, booking_ids: list[str]
    ) -> tuple[str, list[BookingSummary]]:
        unique_booking_ids = list(dict.fromkeys(booking_ids))
        if not unique_booking_ids:
            raise BookingValidationError("booking_ids cannot be empty.")

        entries = [self.get(db, booking_id) for booking_id in unique_booking_ids]
        for entry in entries:
            if entry.user_id != user_id:
                raise BookingValidationError(
                    f"Booking {entry.booking_id} does not belong to user {user_id}."
                )

        batch_booking_id = str(uuid4())
        batch = BookingBatch(
            booking_id=batch_booking_id,
            user_id=user_id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(batch)
        for booking_id in unique_booking_ids:
            db.add(
                BookingBatchItem(
                    batch_booking_id=batch_booking_id,
                    booking_id=booking_id,
                )
            )
        db.commit()
        return batch_booking_id, self._to_summaries(entries)

    def get_batch(
        self, db: Session, *, batch_booking_id: str
    ) -> tuple[str, list[BookingSummary]]:
        batch = db.get(BookingBatch, batch_booking_id)
        if batch is None:
            raise BookingNotFoundError("Booking batch not found.")

        stmt = (
            select(Booking)
            .join(BookingBatchItem, BookingBatchItem.booking_id == Booking.booking_id)
            .where(BookingBatchItem.batch_booking_id == batch_booking_id)
            .order_by(Booking.created_at.desc())
        )
        entries = db.execute(stmt).scalars().all()
        return batch.user_id, self._to_summaries(entries)

    def _to_summaries(self, bookings: list[Booking]) -> list[BookingSummary]:
        return [
            BookingSummary(
                booking_id=b.booking_id,
                hold_id=b.hold_id,
                property_id=getattr(b, "property_id", None),
                room_id=b.room_id,
                user_id=b.user_id,
                check_in=b.check_in,
                check_out=b.check_out,
                units=b.units,
                guest_count=getattr(b, "guest_count", 1),
                status=BookingStatus(b.status),
                expires_at=b.expires_at,
            )
            for b in bookings
        ]


booking_service = BookingService()
