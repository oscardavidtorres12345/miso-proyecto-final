from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from threading import Lock
from uuid import uuid4

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from src.domain.schemas import (
    CancelHoldResponse,
    ConfirmHoldResponse,
    CreateHoldRequest,
    HoldResponse,
    HoldStatus,
    StockResponse,
    StockUpsertRequest,
)
from src.infrastructure.database.models import InventoryHold, InventoryStock


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


class InventoryService:
    """
    Persistent inventory source of truth.

    Uses SQLAlchemy sessions and a process lock to keep updates across stock rows
    and hold state transitions consistent in this MVP.
    """

    def __init__(self, hold_ttl_minutes: int = 15):
        self._hold_ttl = timedelta(minutes=hold_ttl_minutes)
        self._lock = Lock()

    def upsert_stock(self, db: Session, payload: StockUpsertRequest) -> StockResponse:
        with self._lock:
            existing = db.get(InventoryStock, (payload.room_id, payload.date))
            if existing is None:
                existing = InventoryStock(
                    room_id=payload.room_id,
                    date=payload.date,
                    total_units=payload.total_units,
                    confirmed_units=payload.confirmed_units,
                    held_units=0,
                )
                db.add(existing)
            else:
                existing.total_units = payload.total_units
                existing.confirmed_units = payload.confirmed_units

            if existing.confirmed_units + existing.held_units > existing.total_units:
                raise InventoryUnavailableError(
                    "Stock update would violate confirmed+held <= total units."
                )

            db.commit()
            db.refresh(existing)
            return self._to_stock_response(existing)

    def create_hold(self, db: Session, payload: CreateHoldRequest) -> HoldResponse:
        with self._lock:
            self._expire_holds_locked(db, now=datetime.now(timezone.utc))

            nights = self._date_range(payload.check_in, payload.check_out)
            stocks = self._load_stock_range(
                db, payload.room_id, payload.check_in, payload.check_out
            )

            if len(stocks) != len(nights):
                raise InventoryUnavailableError(
                    "Inventory is not configured for the requested room/date range."
                )

            stock_by_day = {s.date: s for s in stocks}
            for day in nights:
                entry = stock_by_day.get(day)
                if entry is None:
                    raise InventoryUnavailableError(
                        "Inventory is not configured for the requested room/date range."
                    )
                if self._available_units(entry) < payload.units:
                    raise InventoryUnavailableError(
                        "Not enough units available for the requested room/date range."
                    )

            created_at = datetime.now(timezone.utc)
            hold = InventoryHold(
                hold_id=str(uuid4()),
                room_id=payload.room_id,
                user_id=payload.user_id,
                check_in=payload.check_in,
                check_out=payload.check_out,
                units=payload.units,
                status=HoldStatus.ACTIVE.value,
                created_at=created_at,
                expires_at=created_at + self._hold_ttl,
                updated_at=None,
            )
            db.add(hold)

            for day in nights:
                stock_by_day[day].held_units += payload.units

            db.commit()
            db.refresh(hold)
            return self._to_hold_response(hold)

    def get_hold(self, db: Session, hold_id: str) -> HoldResponse:
        with self._lock:
            self._expire_holds_locked(db, now=datetime.now(timezone.utc))
            hold = db.get(InventoryHold, hold_id)
            if hold is None:
                raise HoldNotFoundError("Hold not found.")
            return self._to_hold_response(hold)

    def confirm_hold(self, db: Session, hold_id: str) -> ConfirmHoldResponse:
        with self._lock:
            self._expire_holds_locked(db, now=datetime.now(timezone.utc))

            hold = db.get(InventoryHold, hold_id)
            if hold is None:
                raise HoldNotFoundError("Hold not found.")
            if hold.status == HoldStatus.EXPIRED.value:
                raise HoldExpiredError("Hold already expired.")
            if hold.status == HoldStatus.CANCELLED.value:
                raise HoldConflictError("Cancelled hold cannot be confirmed.")
            if hold.status == HoldStatus.CONFIRMED.value:
                raise HoldConflictError("Hold already confirmed.")

            stocks = self._load_stock_range(
                db, hold.room_id, hold.check_in, hold.check_out
            )
            stock_by_day = {s.date: s for s in stocks}
            for day in self._date_range(hold.check_in, hold.check_out):
                entry = stock_by_day[day]
                entry.held_units -= hold.units
                entry.confirmed_units += hold.units

            now = datetime.now(timezone.utc)
            hold.status = HoldStatus.CONFIRMED.value
            hold.updated_at = now

            db.commit()
            return ConfirmHoldResponse(
                hold_id=hold.hold_id,
                status=HoldStatus.CONFIRMED,
                confirmed_at=now,
            )

    def cancel_hold(self, db: Session, hold_id: str) -> CancelHoldResponse:
        with self._lock:
            self._expire_holds_locked(db, now=datetime.now(timezone.utc))

            hold = db.get(InventoryHold, hold_id)
            if hold is None:
                raise HoldNotFoundError("Hold not found.")
            if hold.status == HoldStatus.EXPIRED.value:
                raise HoldExpiredError("Hold already expired.")
            if hold.status == HoldStatus.CONFIRMED.value:
                raise HoldConflictError("Confirmed hold cannot be cancelled.")
            if hold.status == HoldStatus.CANCELLED.value:
                raise HoldConflictError("Hold already cancelled.")

            stocks = self._load_stock_range(
                db, hold.room_id, hold.check_in, hold.check_out
            )
            stock_by_day = {s.date: s for s in stocks}
            for day in self._date_range(hold.check_in, hold.check_out):
                stock_by_day[day].held_units -= hold.units

            now = datetime.now(timezone.utc)
            hold.status = HoldStatus.CANCELLED.value
            hold.updated_at = now

            db.commit()
            return CancelHoldResponse(
                hold_id=hold.hold_id,
                status=HoldStatus.CANCELLED,
                cancelled_at=now,
            )

    def expire_holds(self, db: Session) -> int:
        with self._lock:
            return self._expire_holds_locked(db, now=datetime.now(timezone.utc))

    @staticmethod
    def _date_range(check_in: date, check_out: date) -> list[date]:
        nights = (check_out - check_in).days
        return [check_in + timedelta(days=i) for i in range(nights)]

    def _expire_holds_locked(self, db: Session, now: datetime) -> int:
        stmt = select(InventoryHold).where(
            and_(
                InventoryHold.status == HoldStatus.ACTIVE.value,
                InventoryHold.expires_at <= now,
            )
        )
        active_expired = db.execute(stmt).scalars().all()

        expired = 0
        for hold in active_expired:
            stocks = self._load_stock_range(
                db, hold.room_id, hold.check_in, hold.check_out
            )
            stock_by_day = {s.date: s for s in stocks}
            for day in self._date_range(hold.check_in, hold.check_out):
                stock_by_day[day].held_units -= hold.units

            hold.status = HoldStatus.EXPIRED.value
            hold.updated_at = now
            expired += 1

        if expired > 0:
            db.commit()
        return expired

    @staticmethod
    def _available_units(entry: InventoryStock) -> int:
        return entry.total_units - entry.confirmed_units - entry.held_units

    @staticmethod
    def _to_stock_response(entry: InventoryStock) -> StockResponse:
        return StockResponse(
            room_id=entry.room_id,
            date=entry.date,
            total_units=entry.total_units,
            confirmed_units=entry.confirmed_units,
            held_units=entry.held_units,
            available_units=entry.total_units
            - entry.confirmed_units
            - entry.held_units,
        )

    @staticmethod
    def _to_hold_response(entry: InventoryHold) -> HoldResponse:
        return HoldResponse(
            hold_id=entry.hold_id,
            room_id=entry.room_id,
            user_id=entry.user_id,
            check_in=entry.check_in,
            check_out=entry.check_out,
            units=entry.units,
            status=HoldStatus(entry.status),
            created_at=entry.created_at,
            expires_at=entry.expires_at,
            updated_at=entry.updated_at,
        )

    @staticmethod
    def _load_stock_range(
        db: Session, room_id: int, check_in: date, check_out: date
    ) -> list[InventoryStock]:
        stmt = (
            select(InventoryStock)
            .where(
                and_(
                    InventoryStock.room_id == room_id,
                    InventoryStock.date >= check_in,
                    InventoryStock.date < check_out,
                )
            )
            .order_by(InventoryStock.date.asc())
        )
        return db.execute(stmt).scalars().all()


inventory_service = InventoryService(hold_ttl_minutes=15)
