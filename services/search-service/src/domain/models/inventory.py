from sqlalchemy import Column, Date, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Inventory(Base):
    """
    Room availability by date.
    Maps the INVENTORY table from the ER diagram.

    Availability = total_quantity - confirmed_quantity > 0
    """
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(
        Integer, ForeignKey("room.id", ondelete="CASCADE"), nullable=False
    )
    date = Column(Date, nullable=False)
    total_quantity = Column(Integer, nullable=False, default=0)
    confirmed_quantity = Column(Integer, nullable=False, default=0)

    # Relationships
    room = relationship("Room", back_populates="inventories")

    __table_args__ = (
        Index("ix_inventory_room_date", "date", "room_id"),
    )

