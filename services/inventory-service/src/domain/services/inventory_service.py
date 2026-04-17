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
    RoomRateResponse,
    RoomRateUpsertRequest,
    StockResponse,
    StockUpsertRequest,
)
from src.infrastructure.database.models import (
    InventoryHold,
    InventoryRoomRate,
    InventoryStaffProperty,
    InventoryStock,
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


class RoomRateNotFoundError(InventoryError):
    """Raised when room rate configuration does not exist."""


class RoomRateAccessDeniedError(InventoryError):
    """Raised when room rate does not belong to the requesting staff profile."""


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

    def upsert_room_rate(
        self,
        db: Session,
        *,
        room_id: int,
        payload: RoomRateUpsertRequest,
        staff_user_id: int,
    ) -> RoomRateResponse:
        with self._lock:
            self._ensure_staff_property_access(
                db,
                staff_user_id=staff_user_id,
                property_id=payload.property_id,
            )
            room_rate = db.get(InventoryRoomRate, room_id)
            now = datetime.now(timezone.utc)
            if room_rate is None:
                room_rate = InventoryRoomRate(
                    room_id=room_id,
                    property_id=payload.property_id,
                    staff_user_id=staff_user_id,
                    room_type=payload.room_type.strip(),
                    base_rate=payload.base_rate,
                    offer_rate=payload.offer_rate,
                    offer_active=payload.offer_active,
                    currency=payload.currency.upper(),
                    updated_at=now,
                )
                db.add(room_rate)
            else:
                if room_rate.property_id != payload.property_id:
                    raise RoomRateAccessDeniedError(
                        "Room is already scoped to a different property."
                    )
                room_rate.property_id = payload.property_id
                room_rate.staff_user_id = staff_user_id
                room_rate.room_type = payload.room_type.strip()
                room_rate.base_rate = payload.base_rate
                room_rate.offer_rate = payload.offer_rate
                room_rate.offer_active = payload.offer_active
                room_rate.currency = payload.currency.upper()
                room_rate.updated_at = now

            start = date.today()
            for offset in range(payload.horizon_days):
                day = start + timedelta(days=offset)
                stock = db.get(InventoryStock, (room_id, day))
                if stock is None:
                    stock = InventoryStock(
                        room_id=room_id,
                        date=day,
                        total_units=payload.total_units,
                        confirmed_units=payload.occupied_units,
                        held_units=0,
                    )
                    db.add(stock)
                else:
                    if payload.occupied_units + stock.held_units > payload.total_units:
                        raise InventoryUnavailableError(
                            "Stock update would violate confirmed+held <= total units."
                        )
                    stock.total_units = payload.total_units
                    stock.confirmed_units = payload.occupied_units

            db.commit()
            return self._to_room_rate_response(db, room_rate)

    def get_room_rate(
        self, db: Session, room_id: int, *, staff_user_id: int | None = None
    ) -> RoomRateResponse:
        with self._lock:
            room_rate = db.get(InventoryRoomRate, room_id)
            if room_rate is None:
                raise RoomRateNotFoundError("Room rate configuration not found.")
            if staff_user_id is not None:
                allowed_properties = self._allowed_properties_for_staff(
                    db, staff_user_id=staff_user_id
                )
                if room_rate.property_id not in allowed_properties:
                    raise RoomRateAccessDeniedError(
                        "Room rate configuration is not accessible for this profile."
                    )
            return self._to_room_rate_response(db, room_rate)

    def list_room_rates(
        self,
        db: Session,
        *,
        staff_user_id: int | None = None,
        property_id: int | None = None,
        currency: str | None = None,
    ) -> list[RoomRateResponse]:
        with self._lock:
            stmt = select(InventoryRoomRate)
            if staff_user_id is not None:
                allowed_properties = self._allowed_properties_for_staff(
                    db, staff_user_id=staff_user_id
                )
                if not allowed_properties:
                    return []
                stmt = stmt.where(InventoryRoomRate.property_id.in_(allowed_properties))
            if property_id is not None:
                stmt = stmt.where(InventoryRoomRate.property_id == property_id)
            if currency:
                stmt = stmt.where(InventoryRoomRate.currency == currency.upper())
            stmt = stmt.order_by(
                InventoryRoomRate.room_type.asc(), InventoryRoomRate.room_id.asc()
            )
            entries = db.execute(stmt).scalars().all()
            return [self._to_room_rate_response(db, e) for e in entries]

    def get_stock_window(
        self, db: Session, *, room_id: int, start: date, end: date
    ) -> list[InventoryStock]:
        with self._lock:
            return self._load_stock_range(db, room_id, start, end)

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

    def _to_room_rate_response(
        self, db: Session, entry: InventoryRoomRate
    ) -> RoomRateResponse:
        today_stock = db.get(InventoryStock, (entry.room_id, date.today()))
        occupied = today_stock.confirmed_units if today_stock else 0
        total = today_stock.total_units if today_stock else 0
        offer_enabled = entry.offer_active and entry.offer_rate is not None
        effective = entry.offer_rate if offer_enabled else entry.base_rate
        offer_status = "Activa" if offer_enabled else "Inactiva"
        return RoomRateResponse(
            room_id=entry.room_id,
            property_id=entry.property_id,
            staff_user_id=entry.staff_user_id,
            room_type=entry.room_type,
            base_rate=entry.base_rate,
            offer_rate=entry.offer_rate,
            offer_active=entry.offer_active,
            effective_rate=effective,
            currency=entry.currency,
            occupied_units=occupied,
            total_units=total,
            availability=f"{occupied}/{total}",
            offer_status=offer_status,
            updated_at=entry.updated_at,
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

    @staticmethod
    def _allowed_properties_for_staff(db: Session, *, staff_user_id: int) -> set[int]:
        stmt = select(InventoryStaffProperty.property_id).where(
            InventoryStaffProperty.staff_user_id == staff_user_id
        )
        return {int(v) for v in db.execute(stmt).scalars().all()}

    def _ensure_staff_property_access(
        self,
        db: Session,
        *,
        staff_user_id: int,
        property_id: int,
    ) -> None:
        allowed_properties = self._allowed_properties_for_staff(
            db, staff_user_id=staff_user_id
        )
        if not allowed_properties:
            # Bootstrap: first property assignment for this staff profile.
            db.add(
                InventoryStaffProperty(
                    staff_user_id=staff_user_id,
                    property_id=property_id,
                    created_at=datetime.now(timezone.utc),
                )
            )
            return
        if property_id not in allowed_properties:
            raise RoomRateAccessDeniedError(
                "Property is not accessible for this staff profile."
            )


inventory_service = InventoryService(hold_ttl_minutes=15)
