from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.connection import Base


class InventoryStock(Base):
    __tablename__ = "inventory_stock"

    room_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, primary_key=True)
    total_units: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    confirmed_units: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    held_units: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class InventoryHold(Base):
    __tablename__ = "inventory_hold"
    __table_args__ = (UniqueConstraint("hold_id", name="uq_inventory_hold_id"),)

    hold_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    room_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    units: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class InventoryRoomRate(Base):
    __tablename__ = "inventory_room_rate"

    room_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    property_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    staff_user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    room_type: Mapped[str] = mapped_column(String(120), nullable=False)
    base_rate: Mapped[float] = mapped_column(Float, nullable=False)
    offer_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    offer_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="COP")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )


class InventoryStaffProperty(Base):
    __tablename__ = "inventory_staff_property"
    __table_args__ = (
        UniqueConstraint(
            "staff_user_id",
            "property_id",
            name="uq_inventory_staff_property_staff_property",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    staff_user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    property_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
