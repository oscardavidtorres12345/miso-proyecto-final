from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from threading import Lock
from uuid import uuid4

from src.domain.schemas import (
    CancelHoldResponse,
    ConfirmHoldResponse,
    CreateHoldRequest,
    HoldResponse,
    HoldStatus,
    StockResponse,
    StockUpsertRequest,
)


class InventoryError(Exception):
    """Base inventory error."""


class HoldNotFoundError(InventoryError):
    """Raised when hold_id does not exist."""


class HoldExpiredError(InventoryError):
    """Raised when trying to use an expired hold."""


class HoldConflictError(InventoryError):
    """Raised when hold state does not allow requested action."""


class InventoryUnavailableError(InventoryError):
    """Raised when stock is not enough to create the hold."""


@dataclass(slots=True)
class StockEntry:
    total_units: int
    confirmed_units: int
    held_units: int = 0

    @property
    def available_units(self) -> int:
        return self.total_units - self.confirmed_units - self.held_units


@dataclass(slots=True)
class HoldEntry:
    hold_id: str
    room_id: int
    user_id: str
    check_in: date
    check_out: date
    units: int
    status: HoldStatus
    created_at: datetime
    expires_at: datetime
    updated_at: datetime | None = None


class InventoryService:
    """
    In-memory inventory source of truth for MVP.

    Thread-safe with a process-level lock to guarantee atomic updates
    across stock rows and hold state transitions.
    """

    def __init__(self, hold_ttl_minutes: int = 15):
        self._hold_ttl = timedelta(minutes=hold_ttl_minutes)
        self._lock = Lock()
        self._stock: dict[tuple[int, date], StockEntry] = {}
        self._holds: dict[str, HoldEntry] = {}

    def upsert_stock(self, payload: StockUpsertRequest) -> StockResponse:
        with self._lock:
            key = (payload.room_id, payload.date)
            current_held = self._stock[key].held_units if key in self._stock else 0

            entry = StockEntry(
                total_units=payload.total_units,
                confirmed_units=payload.confirmed_units,
                held_units=current_held,
            )
            self._stock[key] = entry
            return self._to_stock_response(payload.room_id, payload.date, entry)

    def create_hold(self, payload: CreateHoldRequest) -> HoldResponse:
        with self._lock:
            self._expire_holds_locked(now=datetime.now(timezone.utc))

            nights = self._date_range(payload.check_in, payload.check_out)
            missing_days = [
                d for d in nights if (payload.room_id, d) not in self._stock
            ]
            if missing_days:
                raise InventoryUnavailableError(
                    "Inventory is not configured for the requested room/date range."
                )

            for day in nights:
                entry = self._stock[(payload.room_id, day)]
                if entry.available_units < payload.units:
                    raise InventoryUnavailableError(
                        "Not enough units available for the requested room/date range."
                    )

            created_at = datetime.now(timezone.utc)
            hold = HoldEntry(
                hold_id=str(uuid4()),
                room_id=payload.room_id,
                user_id=payload.user_id,
                check_in=payload.check_in,
                check_out=payload.check_out,
                units=payload.units,
                status=HoldStatus.ACTIVE,
                created_at=created_at,
                expires_at=created_at + self._hold_ttl,
                updated_at=None,
            )

            for day in nights:
                self._stock[(payload.room_id, day)].held_units += payload.units

            self._holds[hold.hold_id] = hold
            return self._to_hold_response(hold)

    def get_hold(self, hold_id: str) -> HoldResponse:
        with self._lock:
            self._expire_holds_locked(now=datetime.now(timezone.utc))
            hold = self._holds.get(hold_id)
            if hold is None:
                raise HoldNotFoundError("Hold not found.")
            return self._to_hold_response(hold)

    def confirm_hold(self, hold_id: str) -> ConfirmHoldResponse:
        with self._lock:
            self._expire_holds_locked(now=datetime.now(timezone.utc))

            hold = self._holds.get(hold_id)
            if hold is None:
                raise HoldNotFoundError("Hold not found.")
            if hold.status == HoldStatus.EXPIRED:
                raise HoldExpiredError("Hold already expired.")
            if hold.status == HoldStatus.CANCELLED:
                raise HoldConflictError("Cancelled hold cannot be confirmed.")
            if hold.status == HoldStatus.CONFIRMED:
                raise HoldConflictError("Hold already confirmed.")

            for day in self._date_range(hold.check_in, hold.check_out):
                entry = self._stock[(hold.room_id, day)]
                entry.held_units -= hold.units
                entry.confirmed_units += hold.units

            now = datetime.now(timezone.utc)
            hold.status = HoldStatus.CONFIRMED
            hold.updated_at = now
            return ConfirmHoldResponse(
                hold_id=hold.hold_id,
                status=hold.status,
                confirmed_at=now,
            )

    def cancel_hold(self, hold_id: str) -> CancelHoldResponse:
        with self._lock:
            self._expire_holds_locked(now=datetime.now(timezone.utc))

            hold = self._holds.get(hold_id)
            if hold is None:
                raise HoldNotFoundError("Hold not found.")
            if hold.status == HoldStatus.EXPIRED:
                raise HoldExpiredError("Hold already expired.")
            if hold.status == HoldStatus.CONFIRMED:
                raise HoldConflictError("Confirmed hold cannot be cancelled.")
            if hold.status == HoldStatus.CANCELLED:
                raise HoldConflictError("Hold already cancelled.")

            for day in self._date_range(hold.check_in, hold.check_out):
                entry = self._stock[(hold.room_id, day)]
                entry.held_units -= hold.units

            now = datetime.now(timezone.utc)
            hold.status = HoldStatus.CANCELLED
            hold.updated_at = now

            return CancelHoldResponse(
                hold_id=hold.hold_id,
                status=hold.status,
                cancelled_at=now,
            )

    def expire_holds(self) -> int:
        with self._lock:
            return self._expire_holds_locked(now=datetime.now(timezone.utc))

    def reset_state(self) -> None:
        with self._lock:
            self._stock.clear()
            self._holds.clear()

    @staticmethod
    def _date_range(check_in: date, check_out: date) -> list[date]:
        nights = (check_out - check_in).days
        return [check_in + timedelta(days=i) for i in range(nights)]

    def _expire_holds_locked(self, now: datetime) -> int:
        expired = 0
        for hold in self._holds.values():
            if hold.status != HoldStatus.ACTIVE:
                continue
            if hold.expires_at > now:
                continue

            for day in self._date_range(hold.check_in, hold.check_out):
                entry = self._stock[(hold.room_id, day)]
                entry.held_units -= hold.units

            hold.status = HoldStatus.EXPIRED
            hold.updated_at = now
            expired += 1
        return expired

    @staticmethod
    def _to_stock_response(room_id: int, day: date, entry: StockEntry) -> StockResponse:
        return StockResponse(
            room_id=room_id,
            date=day,
            total_units=entry.total_units,
            confirmed_units=entry.confirmed_units,
            held_units=entry.held_units,
            available_units=entry.available_units,
        )

    @staticmethod
    def _to_hold_response(entry: HoldEntry) -> HoldResponse:
        return HoldResponse(
            hold_id=entry.hold_id,
            room_id=entry.room_id,
            user_id=entry.user_id,
            check_in=entry.check_in,
            check_out=entry.check_out,
            units=entry.units,
            status=entry.status,
            created_at=entry.created_at,
            expires_at=entry.expires_at,
            updated_at=entry.updated_at,
        )


inventory_service = InventoryService(hold_ttl_minutes=15)
