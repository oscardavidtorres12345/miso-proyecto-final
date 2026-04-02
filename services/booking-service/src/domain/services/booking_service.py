from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from threading import Lock
from uuid import uuid4

from src.domain.schemas import BookingStatus, BookingSummary


class BookingNotFoundError(Exception):
    pass


class BookingConflictError(Exception):
    pass


@dataclass(slots=True)
class BookingEntry:
    booking_id: str
    hold_id: str
    room_id: int
    user_id: str
    check_in: date
    check_out: date
    units: int
    status: BookingStatus
    created_at: datetime
    expires_at: datetime | None = None
    updated_at: datetime | None = None


class BookingService:
    def __init__(self):
        self._lock = Lock()
        self._bookings: dict[str, BookingEntry] = {}

    def create_on_hold(
        self,
        *,
        hold_id: str,
        room_id: int,
        user_id: str,
        check_in: date,
        check_out: date,
        units: int,
        expires_at: datetime | None,
    ) -> BookingEntry:
        with self._lock:
            booking_id = str(uuid4())
            entry = BookingEntry(
                booking_id=booking_id,
                hold_id=hold_id,
                room_id=room_id,
                user_id=user_id,
                check_in=check_in,
                check_out=check_out,
                units=units,
                status=BookingStatus.ON_HOLD,
                created_at=datetime.utcnow(),
                expires_at=expires_at,
            )
            self._bookings[booking_id] = entry
            return entry

    def get(self, booking_id: str) -> BookingEntry:
        with self._lock:
            entry = self._bookings.get(booking_id)
            if entry is None:
                raise BookingNotFoundError("Booking not found.")
            return entry

    def mark_confirmed(self, booking_id: str) -> BookingEntry:
        with self._lock:
            entry = self._bookings.get(booking_id)
            if entry is None:
                raise BookingNotFoundError("Booking not found.")
            if entry.status == BookingStatus.CONFIRMED:
                raise BookingConflictError("Booking already confirmed.")
            if entry.status in (BookingStatus.CANCELLED, BookingStatus.EXPIRED):
                raise BookingConflictError("Booking is not confirmable.")

            entry.status = BookingStatus.CONFIRMED
            entry.updated_at = datetime.utcnow()
            return entry

    def mark_expired(self, booking_id: str) -> BookingEntry:
        with self._lock:
            entry = self._bookings.get(booking_id)
            if entry is None:
                raise BookingNotFoundError("Booking not found.")
            entry.status = BookingStatus.EXPIRED
            entry.updated_at = datetime.utcnow()
            return entry

    def list_by_user(self, user_id: str) -> list[BookingSummary]:
        with self._lock:
            bookings = [b for b in self._bookings.values() if b.user_id == user_id]

        return [
            BookingSummary(
                booking_id=b.booking_id,
                hold_id=b.hold_id,
                room_id=b.room_id,
                user_id=b.user_id,
                check_in=b.check_in,
                check_out=b.check_out,
                units=b.units,
                status=b.status,
                expires_at=b.expires_at,
            )
            for b in bookings
        ]

    def reset_state(self) -> None:
        with self._lock:
            self._bookings.clear()


booking_service = BookingService()
