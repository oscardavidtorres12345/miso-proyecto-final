from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.domain.schemas import BookingStatus, BookingSummary
from src.infrastructure.database.models import Booking


class BookingNotFoundError(Exception):
    pass


class BookingConflictError(Exception):
    pass


class BookingService:
    def create_on_hold(
        self,
        db: Session,
        *,
        hold_id: str,
        room_id: int,
        user_id: str,
        check_in: date,
        check_out: date,
        units: int,
        expires_at: datetime | None,
    ) -> Booking:
        entry = Booking(
            booking_id=str(uuid4()),
            hold_id=hold_id,
            room_id=room_id,
            user_id=user_id,
            check_in=check_in,
            check_out=check_out,
            units=units,
            status=BookingStatus.ON_HOLD.value,
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
                room_id=b.room_id,
                user_id=b.user_id,
                check_in=b.check_in,
                check_out=b.check_out,
                units=b.units,
                status=BookingStatus(b.status),
                expires_at=b.expires_at,
            )
            for b in bookings
        ]


booking_service = BookingService()
